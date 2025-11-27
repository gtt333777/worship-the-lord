/* ============================================================
   Worship The Lord — songLoader.js
   🟩 FINAL JSON-LYRICS BUILD — CLEAN FIX
   ============================================================ */

console.log("🎵 songLoader.js: Starting (R2 + smart caching)...");

// 🎵 Global audio players
window.vocalAudio  = new Audio();
window.accompAudio = new Audio();

// ============================================================
// Load selected song (audio + lyrics)
// ============================================================
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);

  // ------------------------------------------------------------
  // Remember current song globally (for per-song memory)
  // ------------------------------------------------------------
  window.currentSongName = songName;

  // ------------------------------------------------------------
  // Apply per-song stored volumes (if available)
  // ------------------------------------------------------------
  if (window.perSongVolumeMemory &&
      typeof window.perSongVolumeMemory.applyStoredVolumesForSong === "function") {
    window.perSongVolumeMemory.applyStoredVolumesForSong(songName);
    console.log("🎚️ Per-song volumes applied for", songName);
  }

  // ------------------------------------------------------------
  // Look up URLs for this song
  // ------------------------------------------------------------
  const entry = window.songURLs && window.songURLs[songName];
  if (!entry) {
    console.error("❌ No entry for", songName);
    return;
  }

  const { vocalURL, accURL } = entry;

  // Stop any existing audio
  stopAndUnloadAudio();

  // ------------------------------------------------------------
  // Smart Cache (Cloudflare R2)
  // ------------------------------------------------------------
  try {
    window.vocalAudio.src  = await cacheSong(vocalURL);
    window.accompAudio.src = await cacheSong(accURL);
  } catch (e) {
    console.warn("⚠️ Cache / audio load failed:", e);
    window.vocalAudio.src  = vocalURL;
    window.accompAudio.src = accURL;
  }

  window.vocalAudio.preload  = "auto";
  window.accompAudio.preload = "auto";

  // ============================================================
  // Load JSON lyrics
  // ============================================================
  const jsonFile = `lyrics/${songName}.json`;

  try {
    const res = await fetch(jsonFile);
    if (!res.ok) throw new Error("JSON lyrics not found");

    const json = await res.json();
    console.log("📘 JSON lyrics loaded:", json);

    // Make segments available globally for loopPlayer, etc.
    window.segments = json.tamilSegments || [];

    if (window.loadLyricsFromJSON) {
      window.loadLyricsFromJSON(json);
    } else {
      console.error("❌ loadLyricsFromJSON() missing");
    }
  } catch (err) {
    console.warn("⚠️ Lyrics JSON missing or failed to load:", jsonFile, err);

    // Clear viewer boxes
    const ta = document.getElementById("tamilLyricsBox");
    const en = document.getElementById("englishLyricsBox");
    if (ta) ta.innerHTML = "";
    if (en) en.innerHTML = "";
  }
}

// ============================================================
// Stop / unload audio
// ============================================================
function stopAndUnloadAudio() {
  try {
    window.vocalAudio.pause();
    window.accompAudio.pause();

    window.vocalAudio.currentTime  = 0;
    window.accompAudio.currentTime = 0;

    window.vocalAudio.removeAttribute("src");
    window.accompAudio.removeAttribute("src");

    window.vocalAudio.load();
    window.accompAudio.load();

    console.log("🛑 Audio stopped and unloaded");
  } catch (e) {
    console.warn("⚠️ stopAndUnloadAudio failed:", e);
  }

  // No boost system anymore — keep this for safety
  window.__VOCAL_BOOST_ACTIVE__ = false;
}

// ============================================================
// Play first segment (called by Play button)
// ============================================================
async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) {
    console.warn("⚠️ No songSelect dropdown");
    return;
  }

  const songName = select.value;
  if (!songName) {
    console.warn("⚠️ No song selected");
    return;
  }

  // Load the song (audio + JSON lyrics)
  await loadSelectedSong(songName);

  // 🟢 Wait until segments are available
  let tries = 0;
  while ((!window.segments || window.segments.length === 0) && tries < 30) {
    await new Promise(res => setTimeout(res, 100));
    tries++;
  }

  if (!window.segments || window.segments.length === 0) {
    console.error("❌ First segment not found after waiting.");
    return;
  }

  const first = window.segments[0];
  if (!first || typeof first.start !== "number" || typeof first.end !== "number") {
    console.error("❌ First segment invalid:", first);
    return;
  }

  // 🟢 Only now safe to call
  playSegment(first.start, first.end, 0);
}

// ============================================================
// Segment playback
// ============================================================
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Playing segment: ${startTime} → ${endTime}`);

  if (!window.vocalAudio || !window.accompAudio) {
    console.error("❌ Audio objects missing");
    return;
  }

  window.vocalAudio.currentTime  = startTime;
  window.accompAudio.currentTime = startTime;

  window.vocalAudio.play().catch(err => console.error("Vocal error:", err));
  window.accompAudio.play().catch(err => console.error("Acc error:", err));

  const EPS   = 0.02;
  const DRIFT = 0.06;

  if (window.activeSegmentInterval) {
    clearInterval(window.activeSegmentInterval);
    window.activeSegmentInterval = null;
  }

  window.activeSegmentInterval = setInterval(() => {
    // Sync accompaniment audio
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) {
      window.accompAudio.currentTime = window.vocalAudio.currentTime;
    }

    // 🔥 Live Lyrics Highlight
    if (window.updateLyricsHighlight) {
      window.updateLyricsHighlight(window.vocalAudio.currentTime);
    }

    // Segment end
    if (window.vocalAudio.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.activeSegmentInterval = null;

      window.vocalAudio.pause();
      window.accompAudio.pause();

      if (Array.isArray(window.segments) &&
          index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        if (next && typeof next.start === "number" && typeof next.end === "number") {
          playSegment(next.start, next.end, index + 1);
        }
      }
    }
  }, 50);
}

// ============================================================
// Buttons
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const playBtn  = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  if (playBtn)  playBtn.addEventListener("click", playFirstSegment);
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (window.vocalAudio)  window.vocalAudio.pause();
      if (window.accompAudio) window.accompAudio.pause();
      console.log("⏸️ Paused both tracks");
    });
  }
});

// ============================================================
// Manual cache clear (kept for safety, if you still use it)
// ============================================================
async function clearAudioCache() {
  const ok = confirm("🧹 Delete ALL cached songs?");
  if (!ok) return;
  await caches.delete("songs-cache-v1");
  alert("✅ All songs cleared");
}

// ============================================================
// Safety – Apply slider volume on page load
// ============================================================
window.addEventListener("load", () => {
  try {
    const vSlider = document.getElementById("vocalVolume");
    const aSlider = document.getElementById("accompVolume");

    if (window.vocalAudio && vSlider) {
      window.vocalAudio.volume = parseFloat(vSlider.value) || 0.0027;
    }

    if (window.accompAudio && aSlider) {
      window.accompAudio.volume = parseFloat(aSlider.value) || 0.03;
    }

    console.log("🎚️ Volume safety applied");
  } catch (e) {
    console.warn("⚠️ Volume safety failed:", e);
  }
});
