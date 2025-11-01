// service-worker.js
// ---------------------------------------------
// Worship The Lord - Smart App Cache Manager
// Keeps app shell offline and preserves songs cache
// ---------------------------------------------

const CACHE_NAME = "worship-the-lord-v4";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./WorshipApp_Modular/songLoader.js",
  "./WorshipApp_Modular/cache_management.js",
  "./WorshipApp_Modular/loopPlayer.js",
  "./WorshipApp_Modular/lyricsLoader.js",
  "./WorshipApp_Modular/songNamesLoader.js",
  "./WorshipApp_Modular/bookmarkManager.js",
  "./WorshipApp_Modular/star.js",
  "./WorshipApp_Modular/pwaSetup.js"
];

// INSTALL — cache essential app files (skip failures)
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(OFFLINE_URLS.map(url => cache.add(url)));
      const failed = results.filter(r => r.status === "rejected");
      if (failed.length) {
        console.warn(`⚠️ Some files failed to cache (${failed.length})`);
      }
      await self.skipWaiting();
    })
  );
});

// ACTIVATE — clean old app caches but PRESERVE songs-cache-v1
self.addEventListener("activate", (event) => {
  console.log("⚙️ Service Worker activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          // Preserve the songs cache so MP3s remain across updates
          if (key === "songs-cache-v1") return;
          // Remove older app caches that start with worship-the-lord but are not the current one
          if (key !== CACHE_NAME && key.startsWith("worship-the-lord")) {
            console.log("🗑️ Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH — do not intercept R2 mp3s; use cache-first for app shell
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = req.url;

  // Skip Cloudflare R2 audio files (they are handled by cache_management.js)
  if (url.includes("r2.dev") && (url.endsWith(".mp3") || url.includes("_vocal") || url.includes("_acc"))) {
    return; // let the network handle MP3s
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // background update (non-blocking)
        fetch(req).then((response) => {
          if (response.ok && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
          }
        }).catch(() => {});
        return cached;
      }

      // No cache -> network
      return fetch(req)
        .then((res) => {
          if (res.ok && req.url.startsWith(self.location.origin)) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

// Allow main page to tell SW to skip waiting (optional use)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
