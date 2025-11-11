console.log("🎵 songLoader.js: Starting (R2 + smart caching)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// === Load selected song ===
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);

  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;

  stopAndUnloadAudio();

  // ✅ Use the centralized smart cache system (from cache_management.js)
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

  playSegment(segment.start, segment.end, 0);
}

// === Segment-specific playback ===
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Playing segment: ${startTime} → ${endTime} (${endTime - startTime}s)`);

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  window.vocalAudio.play().catch((e) => console.error("Vocal play error:", e));
  window.accompAudio.play().catch((e) => console.error("Acc play error:", e));

  const EPS = 0.02;
  const DRIFT = 0.06;

  window.activeSegmentInterval = setInterval(() => {
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) window.accompAudio.currentTime = window.vocalAudio.currentTime;

    if (window.vocalAudio.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.activeSegmentInterval = null;

      window.vocalAudio.pause();
      window.accompAudio.pause();

      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50);
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


// --- Safety: Apply slider volumes immediately after song load ---
window.addEventListener("load", () => {
  try {
    const vSlider = document.getElementById("vocalVolume");
    const aSlider = document.getElementById("accompVolume");
    if (window.vocalAudio && vSlider) window.vocalAudio.volume = parseFloat(vSlider.value) || 0.0027;
    if (window.accompAudio && aSlider) window.accompAudio.volume = parseFloat(aSlider.value) || 0.03;
    console.log("🎚️ Volumes re-applied post load (safety check)");
  } catch (e) {
    console.warn("⚠️ Volume reapply safety failed:", e);
  }
});
