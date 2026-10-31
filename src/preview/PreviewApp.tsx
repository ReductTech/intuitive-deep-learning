import { AppRouter, useAppPath } from '../app/Router';
import {isPublicPreview} from '../app/runtimeMode';
import { HomePage } from '../app/HomePage';
import {CourseDetails} from '../shuku/CourseDetails';
import { activeModules } from '../app/modules';
import { BuiltinLearning } from '../shuku/BuiltinLearning';
import { GuestFeaturePage } from '../shuku/GuestFeaturePage';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { SceneDeckPage } from '../app/routes';

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/course', element: <CourseDetails /> },
  { path: '/study', element: <BuiltinLearning /> },
  { path: '/scenedeck/', element: <SceneDeckPage /> },
  { path: '/web_ppt/', element: <SceneDeckPage /> },
  { path: '/web_ppt/slide.html', element: <SceneDeckPage /> },
  // Keep links from the first preview implementation working.
  { path: '/preview', element: new URLSearchParams(location.search).has('module') ? <BuiltinLearning /> : <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  ...activeModules.map(module => ({ path: module.path, element: module.element })),
];

/** Reuse Shuku's actual pages; only routing and the local data source differ. */
export default function PreviewApp() {
  const path = useAppPath();
  return <AppRouter routes={routes} fallback={isPublicPreview?<HomePage />:<GuestFeaturePage key={path + location.search} path={path} />} />;
}
