/* ============================================================
   Worship The Lord — songLoader.js
   🟩 FINAL JSON-LYRICS BUILD — 2025-11-17
   ============================================================ */

console.log("🎵 songLoader.js: Starting (R2 + smart caching)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
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
  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;

  stopAndUnloadAudio();

  // ------------------------------------------------------------
  // Smart Cache (Cloudflare R2)
  // ------------------------------------------------------------
  window.vocalAudio.src = await cacheSong(vocalURL);
  window.accompAudio.src = await cacheSong(accURL);

  window.vocalAudio.preload = "auto";
  window.accompAudio.preload = "auto";

  // ============================================================
  // NEW: Load JSON lyrics instead of .txt
  // ============================================================
  const jsonFile = `lyrics/${songName}.json`;

  try {
    const res = await fetch(jsonFile);
    if (!res.ok) throw new Error("JSON lyrics not found");

    const json = await res.json();
    console.log("📘 JSON lyrics loaded:", json);

    // -------------------------
    // ⭐ Minimal-safe fix:
    // Ensure window.segments contains the tamilSegments array
    // so playFirstSegment() and other code can read it.
    // -------------------------
    window.segments = json.tamilSegments || [];

    if (window.loadLyricsFromJSON) {
      window.loadLyricsFromJSON(json);
    } else {
      console.error("❌ loadLyricsFromJSON() missing");
    }






    // ================================================
// SAFE AUTO-PLAY for shared link
// Waits until segments are fully ready
// ================================================
if (window._sharedLinkSong) {

    if (window._sharedPlayHasRun) return;
    window._sharedPlayHasRun = true;

    console.log("🎶 SAFE auto-play: waiting for segments...");

    function waitForSegments() {
        if (!window.segments || window.segments.length === 0) {
            console.log("⏳ Segments not ready, retrying...");
            return setTimeout(waitForSegments, 300);
        }

        console.log("✅ Segments ready! Auto-playing...");
        const btn = document.getElementById("playBtn");
        if (btn) btn.click();
    }

    waitForSegments();
}







// =====================================================
// 🎚 Auto Volume for shared link (Acc/Vocal = 0.50)
// =====================================================
if (params.has("song")) {
  console.log("🎚 Setting both volumes to 0.50 (shared mode)");

  setTimeout(() => {
    const acc = document.getElementById("accompVolume");
    const voc = document.getElementById("vocalVolume");

    if (acc) { acc.value = 0.50; acc.dispatchEvent(new Event("input")); }
    if (voc) { voc.value = 0.50; voc.dispatchEvent(new Event("input")); }

  }, 1300);
}



  } catch (err) {
    console.warn("⚠️ Lyrics JSON missing:", jsonFile);

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
  window.vocalAudio.pause();
  window.accompAudio.pause();

  window.vocalAudio.currentTime = 0;
  window.accompAudio.currentTime = 0;

  window.vocalAudio.removeAttribute("src");
  window.accompAudio.removeAttribute("src");

  window.vocalAudio.load();
  window.accompAudio.load();

  console.log("🛑 Audio stopped and unloaded");

  // No boost system anymore — keep this for safety
  window.__VOCAL_BOOST_ACTIVE__ = false;
}


/*
// ============================================================
// Play first segment
// ============================================================
async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) return;

  const songName = select.value;
  if (!songName) return console.warn("⚠️ No song selected");

  await loadSelectedSong(songName);

  const segment = window.segments[0];
  if (!segment) return console.error("❌ First segment not found");

  playSegment(segment.start, segment.end, 0);
}
*/


async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) return;

  const songName = select.value;
  if (!songName) {
    console.warn("⚠️ No song selected");
    return;
  }

  // Load the song (audio + JSON lyrics)
  await loadSelectedSong(songName);

  // 🟢 NEW: Wait until segments are available
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

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  window.vocalAudio.play().catch(err => console.error("Vocal error:", err));
  window.accompAudio.play().catch(err => console.error("Acc error:", err));

  const EPS = 0.02;
  const DRIFT = 0.06;

  window.activeSegmentInterval = setInterval(() => {

    // Sync accompaniment audio
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) window.accompAudio.currentTime = window.vocalAudio.currentTime;

    // 🔥 NEW — Live Lyrics Highlight
    if (window.updateLyricsHighlight) {
      window.updateLyricsHighlight(window.vocalAudio.currentTime);
    }

    // Segment end
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

// ============================================================
// Buttons
// ============================================================
document.getElementById("playBtn").addEventListener("click", playFirstSegment);

document.getElementById("pauseBtn").addEventListener("click", () => {
  window.vocalAudio.pause();
  window.accompAudio.pause();
  console.log("⏸️ Paused both tracks");
});

// ============================================================
// Manual cache clear
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

    if (window.vocalAudio && vSlider)
      window.vocalAudio.volume = parseFloat(vSlider.value) || 0.0027;

    if (window.accompAudio && aSlider)
      window.accompAudio.volume = parseFloat(aSlider.value) || 0.03;

    console.log("🎚️ Volume safety applied");
  } catch (e) {
    console.warn("⚠️ Volume safety failed:", e);
  }
});
