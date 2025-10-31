console.log("🎵 songLoader.js: Starting (R2 + progressive smart caching)...");

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

// === Load selected song (progressive) ===
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);
  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;
  stopAndUnloadAudio();

  // --- Progressive start ---
  console.log("🚀 Progressive load: fetching vocal first...");
  const vocalSrc = await fetchWithCache(vocalURL);

  // Assign immediately (can start playback)
  window.vocalAudio.src = vocalSrc;
  window.vocalAudio.preload = "auto";

  // Preload accompaniment asynchronously (parallel but not blocking)
  fetchWithCache(accURL)
    .then(blobURL => {
      window.accompAudio.src = blobURL;
      window.accompAudio.preload = "auto";
      console.log("✅ Accompaniment preloaded");
    })
    .catch(err => console.warn("⚠️ Accompaniment preload failed:", err));

  // Load lyrics (text is lightweight)
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

// === Play the first segment (progressive style) ===
async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) return;
  const songName = select.value;
  if (!songName) return console.warn("⚠️ No song selected");

  await loadSelectedSong(songName);

  // Get the first segment (always start from the first segment)
  const segment = window.segments[0];
  if (!segment) return console.error("❌ First segment not found");

  // Play the first segment
  playSegment(segment.start, segment.end, 0);
}

// === Segment playback (auto-preload next segment) ===
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Playing segment: ${startTime} -> ${endTime} (${endTime - startTime}s)`);

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  // Play both if accompaniment already preloaded
  if (window.accompAudio.src) {
    window.accompAudio.play().catch((e) => console.warn("Acc not ready:", e));
  }
  window.vocalAudio.play().catch((e) => console.error("Vocal play error:", e));

  const EPS = 0.02;  // 20 ms guard
  const DRIFT = 0.06; // 60 ms resync

  window.activeSegmentInterval = setInterval(() => {
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT && window.accompAudio.src) {
      window.accompAudio.currentTime = window.vocalAudio.currentTime;
    }

    if (window.vocalAudio.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.activeSegmentInterval = null;

      window.vocalAudio.pause();
      if (window.accompAudio.src) window.accompAudio.pause();

      // Auto-advance + preload next
      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        console.log(`⏭️ Preloading next segment (${index + 2})...`);

        // Progressive preload — browser keeps buffer hot
        window.vocalAudio.currentTime = next.start;
        if (window.accompAudio.src) window.accompAudio.currentTime = next.start;

        // Play next
        playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50);
}

// === UI controls ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("playBtn")?.addEventListener("click", playFirstSegment);
  document.getElementById("pauseBtn")?.addEventListener("click", () => {
    window.vocalAudio.pause();
    window.accompAudio.pause();
    console.log("⏸️ Paused both tracks");
  });
});

// === Manual cache clear ===
async function clearAudioCache() {
  const CACHE_NAME = "worship-audio-cache-v2";
  const ok = confirm("🧹 Delete cached MP3s?");
  if (!ok) return;
  await caches.delete(CACHE_NAME);
  alert("✅ Cache cleared");
}
