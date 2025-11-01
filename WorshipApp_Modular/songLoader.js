console.log("🎵 songLoader.js: Starting (R2 + smart caching)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// === Load selected song (now uses cacheSong from cache_management.js) ===
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);

  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;

  stopAndUnloadAudio();

  // ✅ Use smart caching system (from cache_management.js)
  window.vocalAudio.src = await cacheSong(vocalURL);
  window.accompAudio.src = await cacheSong(accURL);

  window.vocalAudio.preload = "auto";
  window.accompAudio.preload = "auto";

  // === Load lyrics ===
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

// === Play the first segment ===
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

      // Auto-advance if another segment exists
      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50); // ~20 checks per second
}

// === Buttons: Play / Pause / Clear Cache ===
document.getElementById("playBtn").addEventListener("click", playFirstSegment);

document.getElementById("pauseBtn").addEventListener("click", () => {
  window.vocalAudio.pause();
  window.accompAudio.pause();
  console.log("⏸️ Paused both tracks");
});

// === Manual cache clear (developer only) ===
async function clearAudioCache() {
  const ok = confirm("🧹 Delete ALL cached songs?");
  if (!ok) return;
  await caches.delete("songs-cache-v1");
  alert("✅ All songs cleared");
}
