import { AppRouter } from './app/Router';
import { appRoutes } from './app/routes';
import { LoginGate } from './shuku/LoginGate';
import { lazy, Suspense } from 'react';
import { isLocalPreview } from './app/runtimeMode';
import '../modules/shared/vendor/mathlive/mathlive-fonts.css';
import '../modules/shared/react/styles.css';
import './app/app.css';

const LocalPreview = isLocalPreview
  ? lazy(() => import('./preview/PreviewApp')) : null;

export function App() {
  if (LocalPreview) return <Suspense fallback={<p>正在打开本地课件…</p>}><LocalPreview /></Suspense>;
  return <LoginGate><AppRouter routes={appRoutes} fallback={<p>Page not found.</p>} /></LoginGate>;
}
