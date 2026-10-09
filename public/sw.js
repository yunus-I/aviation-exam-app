// ============================================================
// EAU Mini App Service Worker v5
// IMPORTANT: bump version number on every deployment to
// invalidate stale caches and prevent black-screen issues.
// ============================================================
const CACHE_NAME = 'eau-miniapp-cache-v5';

// Only pre-cache truly static, version-stable assets.
// Do NOT pre-cache Next.js HTML pages — their JS chunk
// references change every deployment.
const STATIC_ASSETS = [
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  // Immediately take control; don't wait for old SW to become idle
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ── Strategy 1: Next.js immutable static assets ──────────────
  // These have content-hashed filenames — safe to cache forever.
  // Next.js already sets long Cache-Control headers; the SW just
  // avoids re-fetching the same bytes on flaky connections.
  if (url.pathname.startsWith('/_next/static/immutable/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // ── Strategy 2: Other static files (fonts, icons, css) ───────
  if (
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cached);
        });
      })
    );
    return;
  }

  // ── Strategy 3: HTML navigation — ALWAYS network-first ───────
  // CRITICAL: Never serve stale HTML for navigation requests.
  // Stale HTML references old JS chunk filenames that no longer
  // exist after a new deployment → causes black screen crashes.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Try the cache; if that also misses, return a minimal 503
        // rather than undefined (undefined causes an unhandled rejection
        // on older Android WebViews which shows as a blank screen).
        return caches.match(request).then((cached) => {
          return cached || new Response(
            '<html><body style="font-family:sans-serif;padding:24px"><h2>Offline</h2><p>Please check your connection and reopen the app from Telegram.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // ── All other requests: network only (API calls, etc.) ───────
  // Do not interfere with API requests to avoid stale data issues.
});
