import { AppRouter } from './app/Router';
import { appRoutes } from './app/routes';
import { LoginGate } from './shuku/LoginGate';
import '../modules/shared/vendor/mathlive/mathlive-fonts.css';
import '../modules/shared/react/styles.css';
import './app/app.css';

export function App() {
  return <LoginGate><AppRouter routes={appRoutes} fallback={<p>Page not found.</p>} /></LoginGate>;
}
