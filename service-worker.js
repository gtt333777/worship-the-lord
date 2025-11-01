// service-worker.js
// ---------------------------------------------
// ✅ Worship The Lord - Smart App Cache Manager
// ✅ Works with GitHub Pages + Cloudflare R2
// ✅ Keeps app shell offline, skips MP3s
// ✅ Updates automatically when new version is deployed
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

// 🧱 INSTALL — Cache essential app files
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        OFFLINE_URLS.map(url => cache.add(url))
      );

      const failed = results.filter(r => r.status === "rejected");
      if (failed.length) {
        console.warn(`⚠️ Some files failed to cache (${failed.length}):`, failed.map(f => f.reason?.message || f));
      }

      await self.skipWaiting();
      console.log("✅ Service Worker install complete.");
    })
  );
});

// 🧹 ACTIVATE — Clean up older app versions
self.addEventListener("activate", (event) => {
  console.log("⚙️ Service Worker activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
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

// 🌐 FETCH — Smart network strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = req.url;

  // 🚫 Skip Cloudflare R2 audio (handled by cache_management.js)
  if (url.includes("r2.dev") && (url.endsWith(".mp3") || url.includes("_vocal") || url.includes("_acc"))) {
    // Don’t intercept music files — handled separately
    return;
  }

  // ✅ Cache-first strategy for app shell
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Background update attempt (non-blocking)
        fetch(req).then((response) => {
          if (response.ok && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
          }
        }).catch(() => {});
        return cached;
      }

      // Network-first fallback
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

// 🔄 LISTEN for manual skipWaiting message (optional)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
