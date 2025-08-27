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

  console.log("🎧 Streaming vocal from:", vocalUrl);
  console.log("🎧 Streaming accompaniment from:", accUrl);

  window.vocalAudio.src = vocalUrl;
  window.accompAudio.src = accUrl;

  // 📱 Mobile tweak: buffer more to reduce seek stalls
  if ((navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.vocalAudio.preload = "auto";
    window.accompAudio.preload = "auto";
  }


  // Only load when play is pressed
  window.vocalAudio.preload = "auto";
  window.accompAudio.preload = "auto";

  // Handshake: mark that we want Segment 1 to auto-start after audio+segments are ready
  window.wantAutoSegment1 = true;

  // Ensure both are ready and start them; store the promise globally
  window.audioReadyPromise = checkReadyAndPlay();

  window.audioReadyPromise.then(() => {
    console.log("🎯 Playback started after both tracks were ready.");

    // If segments are already loaded, start Segment 1 now (one time)
    if (window.wantAutoSegment1 && window.segments && window.segments.length > 0 && typeof window.playSegment === "function") {
      const seg = window.segments[0];
      console.log("🎯 Auto-starting Segment 1 (from songLoader.js)");
      window.playSegment(seg.start, seg.end, 0);
      // Optional single nudge ~150ms later for extra snap (guarded)
      setTimeout(() => {
        if (window.vocalAudio.currentTime < seg.start + 0.2) {
          window.playSegment(seg.start, seg.end, 0);
        }
      }, 150);
      window.wantAutoSegment1 = false;
    }
  });
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  console.log("⏸️ Pause button clicked");
  stopAndUnloadAudio();

  // Clear any loop segment timeout/interval
  if (typeof window.activeSegmentTimeout !== "undefined" && window.activeSegmentTimeout) {
    clearTimeout(window.activeSegmentTimeout);
    window.activeSegmentTimeout = null;
  }
  if (typeof window.activeSegmentInterval !== "undefined" && window.activeSegmentInterval) {
    clearInterval(window.activeSegmentInterval);
    window.activeSegmentInterval = null;
  }

  window.currentlyPlaying = false;
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
