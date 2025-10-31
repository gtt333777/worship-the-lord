// WorshipApp_Modular/songLoader.js
console.log("🎵 songLoader.js: Starting (R2 + smart caching + simple status)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// === Smart cache fetcher (works for Cloudflare R2) ===
async function fetchWithCache(url) {
  const CACHE_NAME = "worship-audio-cache-v2";
  if (!url) return "";

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      console.log("💾 Loaded from cache:", url);
      return URL.createObjectURL(await cachedResponse.blob());
    }

    console.log("🌐 Fetching from R2:", url);
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Network fetch failed");

    cache.put(url, response.clone());
    console.log("📦 Cached:", url);

    return URL.createObjectURL(await response.blob());
  } catch (err) {
    console.error("⚠️ fetchWithCache failed:", err);
    return url; // fallback to direct URL
  }
}

// --- Utility: check cache presence (returns {vocal:bool, acc:bool}) ---
async function checkCacheStatus(songName) {
  const entry = window.songURLs?.[songName];
  if (!entry) return { vocal: false, acc: false };

  const CACHE_NAME = "worship-audio-cache-v2";
  try {
    const cache = await caches.open(CACHE_NAME);
    const vocalMatch = await cache.match(entry.vocalURL);
    const accMatch = await cache.match(entry.accURL);
    return { vocal: !!vocalMatch, acc: !!accMatch };
  } catch (e) {
    return { vocal: false, acc: false };
  }
}

// --- Create status UI under controls (if not exist) ---
function ensureCacheStatusUI() {
  let wrap = document.getElementById("cacheStatusWrap");
  if (wrap) return wrap;

  wrap = document.createElement("div");
  wrap.id = "cacheStatusWrap";
  wrap.style.margin = "12px 0";
  wrap.style.textAlign = "center";
  wrap.style.fontSize = "0.95rem";
  // small inner area
  wrap.innerHTML = `
    <span id="cacheStatusText">Cache status: —</span>
    <button id="preloadMissingBtn" style="margin-left:12px; padding:6px 10px;">Preload missing</button>
  `;
  const playBtn = document.getElementById("playBtn");
  if (playBtn && playBtn.parentNode) {
    playBtn.parentNode.insertBefore(wrap, playBtn.nextSibling);
  } else {
    document.body.appendChild(wrap);
  }

  document.getElementById("preloadMissingBtn").addEventListener("click", async () => {
    const select = document.getElementById("songSelect");
    if (!select) return;
    const songName = select.value;
    if (!songName) return;
    const entry = window.songURLs[songName];
    if (!entry) return;
    // Preload missing: call fetchWithCache only for missing ones
    const status = await checkCacheStatus(songName);
    const promises = [];
    if (!status.vocal) promises.push(fetchWithCache(entry.vocalURL));
    if (!status.acc) promises.push(fetchWithCache(entry.accURL));
    if (promises.length === 0) {
      showCacheStatusText("All files already cached ✅");
      return;
    }
    showCacheStatusText("Preloading missing...");
    try {
      await Promise.all(promises);
      showCacheStatusText("Preload complete ✅");
      // refresh visible status
      updateCacheStatusUI(songName);
    } catch (e) {
      showCacheStatusText("Preload failed ⚠️");
      console.error("Preload error:", e);
    }
  });

  return wrap;
}

function showCacheStatusText(msg) {
  const el = document.getElementById("cacheStatusText");
  if (!el) return;
  el.textContent = `Cache status: ${msg}`;
}

// update the small UI with actual vocal/acc cached state
async function updateCacheStatusUI(songName) {
  ensureCacheStatusUI();
  if (!songName) {
    showCacheStatusText("—");
    return;
  }
  const status = await checkCacheStatus(songName);
  const parts = [];
  parts.push(`Vocal: ${status.vocal ? "cached" : "missing"}`);
  parts.push(`Acc: ${status.acc ? "cached" : "missing"}`);
  showCacheStatusText(parts.join("  ·  "));
}

// === Load selected song ===
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);

  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;

  stopAndUnloadAudio();

  // assign src as before (use fetchWithCache so first-time will cache)
  window.vocalAudio.src = await fetchWithCache(vocalURL);
  window.accompAudio.src = await fetchWithCache(accURL);

  window.vocalAudio.preload = "auto";
  window.accompAudio.preload = "auto";

  // update cache UI so user sees cached/missing
  updateCacheStatusUI(songName);

  const lyricsFile = `lyrics/${songName}.txt`;
  try {
    const res = await fetch(lyricsFile);
    if (!res.ok) throw new Error("Lyrics not found");
    const txt = await res.text();
    const area = document.getElementById("lyricsArea");
    if (area) area.value = txt;
    console.log("✅ Lyrics loaded");
  } catch (err) {
    console.warn("⚠️ Lyrics missing:", lyricsFile);
    const area = document.getElementById("lyricsArea");
    if (area) area.value = "";
  }
}

// === Stop / Play / Pause ===
function stopAndUnloadAudio() {
  window.vocalAudio.pause();
  window.accompAudio.pause();
  window.vocalAudio.currentTime = 0;
  window.accompAudio.currentTime = 0;
  window.vocalAudio.removeAttribute("src");
  window.accompAudio.removeAttribute("src");
  window.vocalAudio.load();
  window.accompAudio.load();
  console.log("🛑 Audio stopped and unloaded");
}

// Play the first segment
async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) return;
  const songName = select.value;
  if (!songName) return console.warn("⚠️ No song selected");

  // call load (which will cache/fetch and update UI)
  await loadSelectedSong(songName);

  // mark as played (removes NEW marker via songNamesLoader)
  try {
    if (typeof window.markSongPlayed === "function") {
      window.markSongPlayed(songName);
    }
  } catch(e){}

  // Get the first segment (always start from the first segment)
  const segment = window.segments?.[0];
  if (!segment) return console.error("❌ First segment not found");

  // Play the first segment
  playSegment(segment.start, segment.end, 0);
}

// === Segment-specific playback ===
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Playing segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  window.vocalAudio.play().catch((e) => console.error("Vocal play error:", e));
  window.accompAudio.play().catch((e) => console.error("Acc play error:", e));

  const EPS = 0.02; // 20ms guard near the end
  const DRIFT = 0.06; // resync if drift > 60ms

  // Watchdog based on actual time to ensure both tracks are in sync
  window.activeSegmentInterval = setInterval(() => {
    // Micro-resync the two tracks if necessary
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) {
      window.accompAudio.currentTime = window.vocalAudio.currentTime;
    }

    // End of segment?
    if (window.vocalAudio.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.activeSegmentInterval = null;

      window.vocalAudio.pause();
      window.accompAudio.pause();

      // Auto-advance from here if there's another segment
      if (index < (window.segments?.length || 0) - 1) {
        const next = window.segments[index + 1];
        playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50); // ~20 checks per second
}

// wire buttons & selection to update cache UI
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("playBtn").addEventListener("click", playFirstSegment);

  document.getElementById("pauseBtn").addEventListener("click", () => {
    window.vocalAudio.pause();
    window.accompAudio.pause();
    console.log("⏸️ Paused both tracks");
  });

  // when selection changes, update cache status UI
  const sel = document.getElementById("songSelect");
  if (sel) {
    sel.addEventListener("change", () => {
      updateCacheStatusUI(sel.value);
    });
    // create UI now
    ensureCacheStatusUI();
  }
});

// === Clear cache manually ===
async function clearAudioCache() {
  const CACHE_NAME = "worship-audio-cache-v2";
  const ok = confirm("🧹 Delete cached MP3s?");
  if (!ok) return;
  await caches.delete(CACHE_NAME);
  alert("✅ Cache cleared");
  // refresh status text
  const sel = document.getElementById("songSelect");
  if (sel) updateCacheStatusUI(sel.value);
}
