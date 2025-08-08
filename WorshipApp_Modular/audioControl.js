// audioControl.js

// Global audio elements
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

// Small helper to keep tracks in sync
function syncTracks() {
  try {
    if (Math.abs(vocalAudio.currentTime - accompAudio.currentTime) > 0.03) {
      accompAudio.currentTime = vocalAudio.currentTime;
      console.log("🎯 Sync corrected after volume change");
    }
  } catch (err) {
    console.warn("⚠️ syncTracks error:", err);
  }
}

["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("input", e => {
    (type === "vocal" ? vocalAudio : accompAudio).volume = parseFloat(e.target.value);
    // ✅ Correct sync immediately after volume change
    syncTracks();
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta)).toFixed(2);
  slider.dispatchEvent(new Event("input"));
}

window.adjustVolume = adjustVolume;
