import { AppRouter } from './app/Router';
import { appRoutes } from './app/routes';
import '../modules/shared/react/styles.css';
import './app/app.css';

export function App() {
  return <AppRouter routes={appRoutes} fallback={<p>Page not found.</p>} />;
}
