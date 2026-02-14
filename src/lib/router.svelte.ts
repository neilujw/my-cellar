/** Valid application route paths. */
type Route = '/' | '/add' | '/search' | '/settings';

/** All supported routes in the application. */
const VALID_ROUTES: ReadonlyArray<Route> = ['/', '/add', '/search', '/settings'];

/** Parses a hash string into a valid route, defaulting to '/'. */
function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  return VALID_ROUTES.includes(path as Route) ? (path as Route) : '/';
}

/** Reactive current route state, driven by the URL hash. */
let currentRoute = $state<Route>(parseRoute(window.location.hash));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentRoute = parseRoute(window.location.hash);
  });
}

/**
 * Returns the current active route.
 * Reactively updates when the URL hash changes.
 */
export function getCurrentRoute(): Route {
  return currentRoute;
}

/**
 * Navigates to the specified route by updating the URL hash.
 * @param path - The route path to navigate to
 */
export function navigate(path: Route): void {
  window.location.hash = `#${path}`;
}

export type { Route };
