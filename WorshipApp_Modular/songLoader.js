console.log("🎵 songLoader.js: Starting (R2 + smart caching + safe timeout)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// === Smart cache fetcher (Cloudflare R2 + timeout-safe) ===
async function fetchWithCache(url) {
  const CACHE_NAME = "worship-audio-cache-v4";
  if (!url) return "";

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("⏰ Fetch timeout")), ms));

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      console.log("💾 Loaded from cache:", url);
      return URL.createObjectURL(await cachedResponse.blob());
    }

    console.log("🌐 Fetching from R2:", url);

    // Timeout-safe fetch (max 10 seconds)
    const response = await Promise.race([
      fetch(url, { mode: "cors" }),
      timeout(10000),
    ]);

    if (!response || !response.ok) throw new Error("Network fetch failed");

    // Store in cache (non-blocking)
    cache.put(url, response.clone());
    console.log("📦 Cached:", url);

    // Try blob, fallback to direct URL if blob fails
    try {
      return URL.createObjectURL(await response.blob());
    } catch {
      console.warn("⚠️ Blob conversion failed, using direct URL");
      return url;
    }
  } catch (err) {
    console.error("⚠️ fetchWithCache failed:", err);
    return url; // Fallback: direct playback
  }
}

// === Load selected song ===
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);
  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;
  const loader = document.getElementById("loadingIndicator");
  if (loader) loader.style.display = "flex";

  stopAndUnloadAudio();

  try {
    const [vocalSrc, accSrc] = await Promise.all([
      fetchWithCache(vocalURL),
      fetchWithCache(accURL),
    ]);

    window.vocalAudio.src = vocalSrc;
    window.accompAudio.src = accSrc;

    window.vocalAudio.preload = "auto";
    window.accompAudio.preload = "auto";

    if (loader) loader.style.display = "none";

    const lyricsFile = `lyrics/${songName}.txt`;
    const res = await fetch(lyricsFile);
    const txt = res.ok ? await res.text() : "";
    const area = document.getElementById("lyricsArea");
    if (area) area.value = txt;
    console.log(res.ok ? "✅ Lyrics loaded" : "⚠️ Lyrics missing");
  } catch (err) {
    console.error("⚠️ loadSelectedSong failed:", err);
    if (loader) loader.style.display = "none"; // Always hide on failure
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

// === Play first segment ===
async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) return;
  const songName = select.value;
  if (!songName) return console.warn("⚠️ No song selected");

  await loadSelectedSong(songName);

  const first = window.segments?.[0];
  if (!first) return console.error("❌ First segment not found");
  playSegment(first.start, first.end, 0);
}

// === Progressive preloading ===
async function preloadNextSegment(segment) {
  if (!segment) return;
  try {
    const { vocalURL, accURL } = window.songURLs[document.getElementById("songSelect").value];
    const v = new Audio(await fetchWithCache(vocalURL));
    const a = new Audio(await fetchWithCache(accURL));
    v.preload = "auto";
    a.preload = "auto";
    segment.vocalAudio = v;
    segment.accAudio = a;
    console.log(`🕐 Preloaded next segment at ${segment.start.toFixed(2)}s`);
  } catch (err) {
    console.warn("⚠️ Error preloading next segment:", err);
  }
}

// === Segment playback ===
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${(endTime - startTime).toFixed(2)}s)`);

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  window.vocalAudio.play().catch(e => console.error("Vocal play error:", e));
  window.accompAudio.play().catch(e => console.error("Acc play error:", e));

  const EPS = 0.02, DRIFT = 0.06;
  window.activeSegmentInterval = setInterval(() => {
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) window.accompAudio.currentTime = window.vocalAudio.currentTime;

    const now = window.vocalAudio.currentTime;
    const remaining = endTime - now;

    // 🔥 Preload next 2s before end
    if (remaining < 2 && index < window.segments.length - 1 && !window.segments[index + 1].preloaded) {
      window.segments[index + 1].preloaded = true;
      preloadNextSegment(window.segments[index + 1]);
    }

    if (now >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.vocalAudio.pause();
      window.accompAudio.pause();

      // Auto-advance
      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50);
}

// === Button listeners ===
document.getElementById("playBtn").addEventListener("click", playFirstSegment);
document.getElementById("pauseBtn").addEventListener("click", () => {
  window.vocalAudio.pause();
  window.accompAudio.pause();
  console.log("⏸️ Paused both tracks");
});

// === Manual cache clear ===
async function clearAudioCache() {
  const CACHE_NAME = "worship-audio-cache-v4";
  const ok = confirm("🧹 Delete cached MP3s?");
  if (!ok) return;
  await caches.delete(CACHE_NAME);
  alert("✅ Cache cleared");
}
