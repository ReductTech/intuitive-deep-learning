import { ErrorPage } from './app/ErrorPage';
import { AppRouter } from './app/Router';
import { appRoutes } from './app/routes';
import { LoginGate } from './shuku/LoginGate';
import LocalPreview from './preview/PreviewApp';
import { isLocalPreview } from './app/runtimeMode';
import '../modules/shared/vendor/mathlive/mathlive-fonts.css';
import '../modules/shared/react/styles.css';
import './app/app.css';

export function App() {
  if (isLocalPreview) return <LocalPreview />;
  return <LoginGate><AppRouter routes={appRoutes} fallback={<ErrorPage status={404}/>} /></LoginGate>;
}
