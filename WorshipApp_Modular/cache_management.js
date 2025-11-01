console.log("🧩 cache_management.js: Smart cache manager + instant playback + visual indicator");
console.log("🧩 cache_management.js: Smart cache manager + instant playback + visual indicator (v2)");


const SONG_CACHE_NAME = "songs-cache-v1";
const BASE_URL = "https://pub-c84190e6ff024cb9876d50ae10614e90.r2.dev/";

// === small helper to show status message ===
function showCacheStatus(msg, color = "gray") {
  const el = document.getElementById("cacheStatus");
  if (!el) return;
  el.textContent = msg;
  el.style.color = color;

  // Auto-hide after 5 seconds (except if message is empty)
  if (msg) setTimeout(() => { el.textContent = ""; }, 5000);
}

// ==================================================
// 🎵 1️⃣ Cache-aware fetch with INSTANT playback + background freshness check
// ==================================================
async function cacheSong(url) {
  if (!("caches" in window)) return url;

  const cache = await caches.open(SONG_CACHE_NAME);
  const versionTag = window.songVersionTag || "";
  const versionedURL = url.includes("?v=") ? url : `${url}?v=${versionTag}`;

  try {
    const cached = await cache.match(versionedURL);

    // ✅ Step 1: If cached, play immediately (no waiting)
    if (cached) {
      console.log("💾 Playing cached copy:", versionedURL);
      showCacheStatus("✅ Cached (checking for updates…)", "green");

      // 🔄 Run update check silently in background
      checkForSongUpdate(versionedURL, cache);

      // Play instantly
      return URL.createObjectURL(await cached.blob());
    }

    // 🆕 Step 2: Not cached → download + store
    showCacheStatus("⬇️ Downloading song…", "blue");
    console.log("🌐 Fetching new song:", versionedURL);

    const response = await fetch(versionedURL, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error("Network fetch failed");

    await cache.put(versionedURL, response.clone());
    showCacheStatus("✅ Cached for offline use", "green");

    return URL.createObjectURL(await response.blob());
  } catch (err) {
    showCacheStatus("⚠️ Using direct stream (cache unavailable)", "red");
    console.warn("⚠️ cacheSong fallback:", err);
    return url;
  }
}

// ==================================================
// 🔄 1B️⃣ Background version checker (non-blocking, silent)
// ==================================================
async function checkForSongUpdate(url, cache) {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    const serverDate = new Date(headResponse.headers.get("last-modified"));
    const cachedResponse = await cache.match(url);
    if (!cachedResponse) return;

    const localDate = new Date(cachedResponse.headers.get("date") || 0);

    if (serverDate > localDate) {
      console.log("🔄 Newer version detected, refreshing:", url);
      const newResponse = await fetch(url, { mode: "cors", cache: "no-store" });
      if (newResponse.ok) {
        await cache.put(url, newResponse.clone());
        console.log("✅ Song cache updated in background:", url);
        showCacheStatus("🔄 Song updated in background", "orange");
      }
    } else {
      console.log("✅ Cached version is current:", url);
    }
  } catch (e) {
    console.warn("⚠️ Background update check failed:", e);
  }
}

// ==================================================
// 🧹 2️⃣ Clear ALL song cache
// ==================================================
async function clearAllSongCache() {
  const ok = confirm("🔥 Delete ALL cached songs?");
  if (!ok) return;
  await caches.delete(SONG_CACHE_NAME);
  showCacheStatus("🧹 All cached songs cleared", "orange");
}

// ==================================================
// 🧹 3️⃣ Clear selected song cache
// ==================================================
async function clearSingleSongCache(songName) {
  if (!songName) return alert("⚠️ No song selected");
  const versionTag = window.songVersionTag || "";

  const vocalURL = `${BASE_URL}${songName}_vocal.mp3?v=${versionTag}`;
  const accURL   = `${BASE_URL}${songName}_acc.mp3?v=${versionTag}`;

  const cache = await caches.open(SONG_CACHE_NAME);
  const ok = confirm(`🧹 Delete cached files for "${songName}"?`);
  if (!ok) return;

  let removed = false;
  for (const url of [vocalURL, accURL]) {
    const deleted = await cache.delete(url);
    if (deleted) {
      console.log("🗑️ Removed:", url);
      removed = true;
    }
  }
  showCacheStatus(removed ? `✅ Cleared ${songName}` : `⚠️ No cache found`, removed ? "green" : "gray");
}

// ==================================================
// 📊 4️⃣ Cache info (how many + size)
// ==================================================
async function showCacheInfo() {
  const cache = await caches.open(SONG_CACHE_NAME);
  const keys = await cache.keys();
  let totalBytes = 0;
  for (const req of keys) {
    const res = await cache.match(req);
    if (res) {
      const blob = await res.blob();
      totalBytes += blob.size;
    }
  }
  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  showCacheStatus(`🎵 Cached: ${keys.length} songs (${mb} MB)`, "gray");
}

// ==================================================
// ♻️ 5️⃣ Auto-clean old songs (older than 60 days)
// ==================================================
async function autoCleanOldSongs() {
  if (!("caches" in window)) return;
  const cache = await caches.open(SONG_CACHE_NAME);
  const keys = await cache.keys();
  const now = Date.now();
  let removed = 0;

  for (const req of keys) {
    const res = await cache.match(req);
    if (res) {
      const date = new Date(res.headers.get("date") || 0).getTime();
      if (now - date > 60 * 24 * 3600 * 1000) {
        await cache.delete(req);
        removed++;
      }
    }
  }
  if (removed > 0) console.log(`♻️ Removed ${removed} outdated song(s)`);
}
// autoCleanOldSongs();   // ⛔ disabled to preserve songs permanently
