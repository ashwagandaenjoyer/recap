const CACHE_NAME = 'recap-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Only handle same-origin requests (the app shell). Everything else — the
// Anthropic API, CDN fonts/libraries — goes straight to the network so the
// app always uses current data and current library versions.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if(response && response.ok){
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
