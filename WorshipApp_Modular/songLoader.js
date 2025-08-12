// WorshipApp_Modular/songLoader.js

// Make sure these are global (plain globals are fine for your setup)
window.vocalAudio = window.vocalAudio || new Audio();
window.accompAudio = window.accompAudio || new Audio();

// === Pause toggle button (keeps Pause button but acts as toggle) ===
let currentlyPlaying = false;
let isPaused = false;
let pausedAt = 0; // keep track for resume

document.getElementById("pauseBtn").addEventListener("click", () => {
  console.log("⏸️ Pause button clicked (toggle)");

  // If nothing is playing, do nothing
  if (!currentlyPlaying && !isPaused) {
    console.log("⏸️ Nothing playing right now.");
    return;
  }

  // If currently playing -> pause and record current time
  if (currentlyPlaying) {
    vocalAudio.pause();
    accompAudio.pause();
    // Save time to resume
    pausedAt = Math.max(vocalAudio.currentTime || 0, accompAudio.currentTime || 0);
    currentlyPlaying = false;
    isPaused = true;

    // Clear any segment timeout so it doesn't expire while paused
    if (typeof activeSegmentTimeout !== "undefined" && activeSegmentTimeout) {
      clearTimeout(activeSegmentTimeout);
      activeSegmentTimeout = null;
    }

    console.log("⏸️ Playback paused at", pausedAt);
    return;
  }

  // If paused -> resume from pausedAt
  if (isPaused) {
    // Resume both at the same position
    try {
      vocalAudio.currentTime = pausedAt;
      accompAudio.currentTime = pausedAt;
    } catch (err) {
      console.warn("⚠️ Could not set currentTime on resume:", err);
    }

    Promise.all([
      vocalAudio.play().catch(err => console.warn("❌ Vocal resume error:", err)),
      accompAudio.play().catch(err => console.warn("❌ Accompaniment resume error:", err))
    ]).then(() => {
      currentlyPlaying = true;
      isPaused = false;
      console.log("▶️ Resumed playback from", pausedAt);
      // Note: segment timeout handling must be re-established by the caller (loopPlayer.js manages this)
    });

    return;
  }
});

// === Stop & Unload Function ===
function stopAndUnloadAudio() {
  // Pause both
  vocalAudio.pause();
  accompAudio.pause();

  // Reset position
  try {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
  } catch (err) {
    console.warn("⚠️ Could not set currentTime to 0:", err);
  }

  // Remove src to free memory & stop buffering
  vocalAudio.removeAttribute("src");
  accompAudio.removeAttribute("src");

  // Force unload
  vocalAudio.load();
  accompAudio.load();

  // reset flags
  currentlyPlaying = false;
  isPaused = false;
  pausedAt = 0;

  console.log("🛑 Audio stopped and unloaded from memory.");
}

// === Dropbox URL Builder ===
function getDropboxFileURL(filename) {
  const dropboxPath = "/WorshipSongs/" + filename;
  return `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${ACCESS_TOKEN}&arg={"path":"${dropboxPath}"}`;
}
