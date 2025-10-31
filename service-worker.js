// service-worker.js
// ---------------------------------------------
// ✅ Works with GitHub Pages + Cloudflare R2
// ✅ Caches app shell only (no R2 MP3s)
// ✅ Safe install — skips missing files
// ✅ Allows offline lyrics reading
// ---------------------------------------------

const CACHE_NAME = "worship-the-lord-v3";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./WorshipApp_Modular/songLoader.js",
  "./WorshipApp_Modular/loopPlayer.js",
  "./WorshipApp_Modular/lyricsLoader.js",
  "./WorshipApp_Modular/songNamesLoader.js",
  "./WorshipApp_Modular/bookmarkManager.js",
  "./WorshipApp_Modular/star.js"
];

// 🧱 Install and cache app shell (skip failed URLs)
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
    })
  );
});

// 🧹 Activate and clean old caches
self.addEventListener("activate", (event) => {
  console.log("⚙️ Service Worker activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 🌐 Fetch handler
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = req.url;

  // 🚫 Skip caching for Cloudflare R2 audio files
  if (url.includes("r2.dev") && (url.endsWith(".mp3") || url.includes("_vocal") || url.includes("_acc"))) {
    // stream directly from network
    return;
  }

  // ✅ Standard cache-first strategy
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // store a clone if it’s a successful same-origin response
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
