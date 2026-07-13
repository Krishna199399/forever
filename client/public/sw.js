// Service Worker — Forever Us Production PWA
// Strategy: Cache-First for static assets, Network-First for API calls

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `forever-us-static-${CACHE_VERSION}`;
const API_CACHE = `forever-us-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// --- Install: pre-cache all static assets ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting so the new SW activates immediately
      return self.skipWaiting();
    })
  );
});

// --- Activate: clean up old caches from previous versions ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// --- Fetch: routing strategy ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API calls → Network-First (fresh data preferred, fall back to cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: return cached API response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets → Cache-First (fast loads from cache, update in background)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached immediately, then update cache in background
        fetch(request).then((fresh) => {
          if (fresh.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, fresh));
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache — fetch from network
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Ultimate fallback: return the cached index.html (SPA shell)
          return caches.match('/index.html');
        });
    })
  );
});

