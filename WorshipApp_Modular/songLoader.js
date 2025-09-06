// WorshipApp_Modular/songLoader.js

// Global audio elements (expose on window for other scripts)
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// Flags used for the Play→Segment1 handshake
window.wantAutoSegment1 = false;      // set true when user presses Play (kept for compatibility)
window.audioReadyPromise = null;      // resolves when both tracks have started

// Internal: debounce for Play button
let __playInFlight = false;

// === Utility: Wait until both tracks are ready, then play together ===
// NOTE: keep this name; loopPlayer.js uses a DIFFERENT name to avoid collision.
function checkReadyAndPlay() {
  return new Promise((resolve) => {
    let vocalReady  = window.vocalAudio.readyState  >= 2;
    let accompReady = window.accompAudio.readyState >= 2;

    const tryPlay = () => {
      if (vocalReady && accompReady) {
        Promise.all([
          window.vocalAudio.play().catch(e => {
            if (!(e && (e.name === 'AbortError' || e.code === 20))) {
              console.error("❌ Vocal play error:", e);
            }
          }),
          window.accompAudio.play().catch(e => {
            if (!(e && (e.name === 'AbortError' || e.code === 20))) {
              console.error("❌ Accompaniment play error:", e);
            }
          })
        ]).then(() => {
          console.log("✅ Both audio tracks started in sync.");
          resolve();
        });
      }
    };

    if (!vocalReady) {
      const onVocalReady = () => { vocalReady = true; tryPlay(); };
      window.vocalAudio.addEventListener("canplaythrough", onVocalReady, { once: true });
      window.vocalAudio.addEventListener("loadeddata",     onVocalReady, { once: true });
      window.vocalAudio.addEventListener("canplay",        onVocalReady, { once: true });
    }
    if (!accompReady) {
      const onAccReady = () => { accompReady = true; tryPlay(); };
      window.accompAudio.addEventListener("canplaythrough", onAccReady, { once: true });
      window.accompAudio.addEventListener("loadeddata",     onAccReady, { once: true });
      window.accompAudio.addEventListener("canplay",        onAccReady, { once: true });
    }

    // If both were already ready, start immediately
    tryPlay();
  });
}

// === Play ===
document.getElementById("playBtn").addEventListener("click", async () => {
  if (__playInFlight) return;
  __playInFlight = true;

  try {
    console.log("▶️ Play button clicked");

    // Fresh run cancels any prior user-pause guard
    window.__userPaused = false;

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
      // NOTE: First segment start remains exactly as your existing loopPlayer.js defines it.
      window.playSegment(seg.start, seg.end, 0);
    });
  } finally {
    __playInFlight = false;
  }
});

// === Pause (pause-safe, no auto-advance after pause) ===
document.getElementById("pauseBtn").addEventListener("click", () => {
  console.log("⏸️ Pause button clicked");

  // Tell everyone this is a user pause, not an internal pause
  window.__userPaused = true;

  // Cancel any active handoff/watchers immediately
  try { if (window.__seamlessStopper) { window.__seamlessStopper(); window.__seamlessStopper = null; } } catch(_) {}
  try { if (window.activeSegmentInterval) { clearInterval(window.activeSegmentInterval); window.activeSegmentInterval = null; } } catch(_) {}

  // Bump run id so any pending code from the old run is invalidated
  window.playRunId = (window.playRunId|0) + 1;

  // Reflect stopped state
  window.currentlyPlaying = false;

  // Actually pause both tracks
  window.vocalAudio.pause();
  window.accompAudio.pause();

  // (Optional) If Wake Lock helper is installed, release it here
  try { if (typeof window.releaseWakeLock === 'function') window.releaseWakeLock(); } catch(_) {}
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
