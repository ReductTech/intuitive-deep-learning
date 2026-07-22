import {
  useCallback,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';
import { classNames } from '../../modules/shared/react/utils';

export interface AppRoute {
  path: string;
  element: ReactNode;
}

export interface AppRouterProps {
  routes: AppRoute[];
  fallback?: ReactNode;
  className?: string;
}

function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] || '/';
  const normalized = withoutQuery.replace(/\/+/g, '/').replace(/\/+$/, '');
  return normalized || '/';
}

function getLocation() {
  return normalizePath(window.location.pathname);
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

export function useAppPath(): string {
  return useSyncExternalStore(subscribe, getLocation, () => '/');
}

export function matchAppRoute(path: string, routePath: string): boolean {
  const current = normalizePath(path);
  const expected = normalizePath(routePath);
  if (expected === '*') return true;
  if (expected.endsWith('/*')) return current === expected.slice(0, -2) || current.startsWith(`${expected.slice(0, -1)}`);
  return current === expected;
}

export function navigate(path: string, replace = false): void {
  const nextPath = normalizePath(path);
  if (replace) window.history.replaceState({}, '', nextPath);
  else window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function AppRouter({ routes, fallback = null, className }: AppRouterProps) {
  const path = useAppPath();
  const route = routes.find((candidate) => matchAppRoute(path, candidate.path));
  return <div className={classNames('app-router', className)}>{route?.element ?? fallback}</div>;
}

export interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

export function AppLink({ to, replace = false, onClick, className, ...props }: AppLinkProps) {
  const handleClick = useCallback<NonNullable<AppLinkProps['onClick']>>((event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to, replace);
  }, [onClick, replace, to]);

  return <a {...props} href={to} className={classNames('app-link', className)} onClick={handleClick} />;
}
