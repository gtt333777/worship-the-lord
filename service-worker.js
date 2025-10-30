
/*
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

*/




// Worship The Lord — Clean Offline-Ready Service Worker
// ------------------------------------------------------
// 🧹 No Netlify or external API caching
// 🧱 Caches only your static assets (HTML, JS, CSS, icons)
// 🔁 Graceful fallback to cache when offline
// ------------------------------------------------------

const CACHE_NAME = 'worship-the-lord-v2'; // increment version when you update files

const OFFLINE_URLS = [
  '/',                // root
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',

  // ✅ Add your modular JS files here for full offline support
  '/WorshipApp_Modular/tokenLoader.js',
  '/WorshipApp_Modular/star.js',
  '/WorshipApp_Modular/songNamesLoader.js',
  '/WorshipApp_Modular/lyricsLoader.js',
  '/WorshipApp_Modular/audioControl.js',
  '/WorshipApp_Modular/skipControl.js',
  '/WorshipApp_Modular/songLoader.js',
  '/WorshipApp_Modular/bookmarkManager.js',
  '/WorshipApp_Modular/pwaSetup.js',
  '/WorshipApp_Modular/loopPlayer.js',
  '/WorshipApp_Modular/segmentProgressVisualizer.js'
];

// 🧠 Install event — cache all core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 🧹 Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 🌐 Fetch handler — serve from cache first, then network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // ❌ Skip Netlify or API calls
  if (request.url.includes('/.netlify/') || request.url.includes('getDropboxToken')) {
    return; // don’t cache or handle those
  }

  // ✅ Handle normal requests
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(request)
        .then(networkResponse => {
          // Optionally cache new static assets
          if (request.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // 🪫 Offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
