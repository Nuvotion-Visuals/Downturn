const CACHE_NAME = 'downturn-v15';
const SHELL_ASSETS = [
  '/',
  '/ui.mjs',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/site.webmanifest',
  '/start.md',
  '/db.mjs',
  '/themes.mjs',
];

// Install — precache the app shell so the app still works offline
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches, then take control of open pages immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — NETWORK FIRST, so a deploy is picked up on the very next load.
// The cache is only ever used as an offline fallback, never served while online.
// (The old cache-first strategy served stale shell assets for at least one extra
// reload, which made server updates appear not to take effect.)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Leave API calls, cross-origin requests, and non-GET methods alone.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === '/api' || url.pathname === '/api/search') return;

  e.respondWith(
    // `cache: 'no-cache'` forces a revalidation with the server (cheap 304s),
    // so the browser's own HTTP cache can never mask a fresh deploy either.
    fetch(e.request, { cache: 'no-cache' }).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
