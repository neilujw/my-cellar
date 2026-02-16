// @ts-nocheck
const CACHE_NAME = 'my-cellar-v1';

/**
 * Static assets to pre-cache on install.
 * Vite hashed filenames are discovered at runtime via the fetch handler.
 */
const PRECACHE_URLS = ['/my-cellar/', '/my-cellar/index.html'];

/** Install: pre-cache the app shell. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

/** Activate: clean up old caches and claim clients. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Fetch: cache-first for static assets (JS, CSS, HTML, images).
 * Network-first for API calls and other dynamic requests.
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Cache-first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Network-first for navigation and dynamic requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/my-cellar/index.html').then((cached) => cached || new Response('Offline')),
      ),
    );
  }
});

/** Checks if a URL path refers to a static asset that should be cached. */
function isStaticAsset(pathname) {
  return /\.(js|css|html|png|svg|ico|woff2?|ttf)$/.test(pathname) || pathname === '/my-cellar/';
}
