import { ErrorPage } from '../app/ErrorPage';
import { ErrorPagePreview } from '../app/ErrorPagePreview';
import { useEffect } from 'react';
import { AppRouter, navigate, useAppPath } from '../app/Router';
import {isPublicPreview} from '../app/runtimeMode';
import { HomePage } from '../app/HomePage';
import {CourseDetails} from '../shuku/CourseDetails';
import { activeModules } from '../app/modules';
import { BuiltinLearning } from '../shuku/BuiltinLearning';
import { GuestFeaturePage } from '../shuku/GuestFeaturePage';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';

const routes = [
  ...(import.meta.env.DEV ? [{path:'/shared/error-preview',element:<ErrorPagePreview/>}] : []),
  { path: '/', element: <HomePage /> },
  { path: '/course', element: <CourseDetails /> },
  { path: '/study', element: <BuiltinLearning /> },
  // Keep links from the first preview implementation working.
  { path: '/preview', element: new URLSearchParams(location.search).has('module') ? <BuiltinLearning /> : <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  ...activeModules.map(module => ({ path: module.path, element: module.element })),
];

/** Reuse Shuku's actual pages; only routing and the local data source differ. */
export default function PreviewApp() {
  const path = useAppPath();
  useEffect(() => {
    // Returning from a local lesson should reuse the loaded app, not boot it again.
    const returnHome = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.top !== window) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.hasAttribute('download') || (link.target && !['_self', '_top'].includes(link.target))) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== '/' || url.search || url.hash) return;
      event.preventDefault();
      navigate('/');
      window.scrollTo(0, 0);
    };
    document.addEventListener('click', returnHome);
    return () => document.removeEventListener('click', returnHome);
  }, []);
  const guestFeature = path.startsWith('/my-courses') || path.startsWith('/edit-deck') || ['/course-creation','/profile','/messages','/data','/scenedeck','/web_ppt','/web_ppt/slide.html'].includes(path);
  return <AppRouter routes={routes} fallback={!isPublicPreview && guestFeature ? <GuestFeaturePage key={path + location.search} path={path}/> : <ErrorPage status={404}/>} />;
}
