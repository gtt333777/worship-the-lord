// WorshipApp_Modular/songLoader.js

// Global audio elements (expose on window for other scripts)
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// Flags used for the Play→Segment1 handshake
window.wantAutoSegment1 = false;      // set true when user presses Play
window.audioReadyPromise = null;      // resolves when both tracks have started

// === Utility: Wait until both tracks are ready, then play together ===
// NOTE: keep this name; loopPlayer.js uses a DIFFERENT name to avoid collision.
function checkReadyAndPlay() {
  return new Promise((resolve) => {
    let vocalReady = window.vocalAudio.readyState >= 2;
    let accompReady = window.accompAudio.readyState >= 2;

    const tryPlay = () => {
      if (vocalReady && accompReady) {
        Promise.all([
          window.vocalAudio.play().catch(err => console.error("❌ Vocal play error:", err)),
          window.accompAudio.play().catch(err => console.error("❌ Accompaniment play error:", err))
        ]).then(() => {
          console.log("✅ Both audio tracks started in sync.");
          resolve();
        });
      }
    };

    if (!vocalReady) {
      window.vocalAudio.addEventListener("canplaythrough", () => {
        vocalReady = true; tryPlay();
      }, { once: true });
    }
    if (!accompReady) {
      window.accompAudio.addEventListener("canplaythrough", () => {
        accompReady = true; tryPlay();
      }, { once: true });
    }

    // If both were already ready, start immediately
    tryPlay();
  });
}

// === Play/Pause ===
document.getElementById("playBtn").addEventListener("click", () => {
  console.log("▶️ Play button clicked");

  if (!ACCESS_TOKEN) {
    console.error("❌ ACCESS_TOKEN not yet loaded.");
    return;
  }

  const songName = document.getElementById("songSelect").value;
  if (!songName) {
    console.warn("⚠️ No song selected.");
    return;
  }

  const vocalUrl = getDropboxFileURL(songName + "_vocal.mp3");
  const accUrl   = getDropboxFileURL(songName + "_acc.mp3");

  // Set sources
  window.vocalAudio.src = vocalUrl;
  window.accompAudio.src = accUrl;

  // Only load when play is pressed
  window.vocalAudio.preload = "auto";
  window.accompAudio.preload = "auto";

  // Warm both tracks and set a promise we can await here
  window.audioReadyPromise = checkReadyAndPlay();

  // Also wait until loop JSON is loaded (poll up to ~2s)
  const waitSegments = new Promise((resolve) => {
    if (window.segments && window.segments.length > 0) return resolve();
    const t0 = Date.now();
    const t = setInterval(() => {
      if (window.segments && window.segments.length > 0) { clearInterval(t); resolve(); }
      else if (Date.now() - t0 > 2000) { clearInterval(t); resolve(); }
    }, 50);
  });

  // When both tracks have started AND segments are known, start Segment 1 via the segment path
  Promise.all([window.audioReadyPromise, waitSegments]).then(() => {
    if (!window.segments || window.segments.length === 0) {
      console.warn("⚠️ No segments loaded yet; cannot start Segment 1.");
      return;
    }
    const seg = window.segments[0];
    console.log("🎯 Play routed to Segment 1 (strict path)");
    window.playSegment(seg.start, seg.end, 0);
  });
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  console.log("⏸️ Pause button clicked");
  window.vocalAudio.pause();
  window.accompAudio.pause();
});

// === Song dropdown change: just set the textarea lyrics; loop JSON is fetched in loopPlayer.js ===
document.addEventListener("DOMContentLoaded", () => {
  const dd = document.getElementById("songSelect");
  const lyricsArea = document.getElementById("lyricsText");
  if (!dd || !lyricsArea) return;

  dd.addEventListener("change", () => {
    const selected = dd.value;
    if (!selected) return;

    fetch(`lyrics/${selected}.txt`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error("Lyrics not found")))
      .then(txt => { lyricsArea.value = txt; })
      .catch(err => { console.warn("⚠️ Could not load lyrics:", err); });
  });
});

// === Stop & Unload Function ===
function stopAndUnloadAudio() {
  // Pause both
  window.vocalAudio.pause();
  window.accompAudio.pause();

  // Reset position
  window.vocalAudio.currentTime = 0;
  window.accompAudio.currentTime = 0;

  // Remove src to free memory & stop buffering
  window.vocalAudio.removeAttribute("src");
  window.accompAudio.removeAttribute("src");

  // Force unload
  window.vocalAudio.load();
  window.accompAudio.load();

  console.log("🛑 Audio stopped and unloaded from memory.");
}

// === Dropbox URL Builder ===
function getDropboxFileURL(filename) {
  const dropboxPath = "/WorshipSongs/" + filename;
  return `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${ACCESS_TOKEN}&arg={"path":"${dropboxPath}"}`;
}
