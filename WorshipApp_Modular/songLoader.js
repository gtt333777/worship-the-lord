console.log("🎵 songLoader.js: Starting (R2 + synchronized progressive preloading)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// === Smart cache fetcher (Cloudflare R2) ===
async function fetchWithCache(url) {
  const CACHE_NAME = "worship-audio-cache-v2";
  if (!url) return "";

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      console.log("💾 Cached hit:", url);
      return URL.createObjectURL(await cached.blob());
    }

    console.log("🌐 Fetching from R2:", url);
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Network fetch failed");

    await cache.put(url, res.clone());
    console.log("📦 Cached:", url);

    return URL.createObjectURL(await res.blob());
  } catch (err) {
    console.error("⚠️ fetchWithCache failed:", err);
    return url; // fallback direct URL
  }
}

// === Load selected song (synchronized parallel load) ===
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);
  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;

  stopAndUnloadAudio();

  try {
    console.log("🚀 Starting parallel preloads...");
    const [vocalSrc, accSrc] = await Promise.all([
      fetchWithCache(vocalURL),
      fetchWithCache(accURL),
    ]);

    window.vocalAudio.src = vocalSrc;
    window.accompAudio.src = accSrc;

    window.vocalAudio.preload = "auto";
    window.accompAudio.preload = "auto";

    console.log("✅ Both tracks preloaded and synchronized.");

    // Load lyrics
    const lyricsFile = `lyrics/${songName}.txt`;
    const res = await fetch(lyricsFile);
    if (!res.ok) throw new Error("Lyrics not found");
    const txt = await res.text();
    const area = document.getElementById("lyricsArea");
    if (area) area.value = txt;
    console.log("✅ Lyrics loaded");
  } catch (err) {
    console.error("⚠️ loadSelectedSong failed:", err);
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

  const segment = window.segments?.[0];
  if (!segment) return console.error("❌ First segment not found");

  playSegment(segment.start, segment.end, 0);
}

// === Segment playback (with prefetching next) ===
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Segment: ${startTime} → ${endTime}`);

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  Promise.all([
    window.vocalAudio.play().catch((e) => console.error("Vocal play error:", e)),
    window.accompAudio.play().catch((e) => console.error("Acc play error:", e)),
  ]);

  const EPS = 0.02;
  const DRIFT = 0.06;

  window.activeSegmentInterval = setInterval(() => {
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) window.accompAudio.currentTime = window.vocalAudio.currentTime;

    if (window.vocalAudio.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.vocalAudio.pause();
      window.accompAudio.pause();

      // Auto-next
      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        console.log(`⏭️ Preparing next segment: ${index + 2}`);
        window.vocalAudio.currentTime = next.start;
        window.accompAudio.currentTime = next.start;
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
