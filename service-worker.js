const CACHE_NAME = 'worship-the-lord-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // You can also cache lyrics files or assets as needed
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
