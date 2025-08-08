// audioControl.js

// Global audio elements
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

// Add volume listeners with drift correction
["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("input", e => {
    const audioEl = (type === "vocal" ? vocalAudio : accompAudio);
    audioEl.volume = parseFloat(e.target.value);

    // --- Drift correction after volume change ---
    try {
      if (!vocalAudio.paused && !accompAudio.paused) {
        const drift = Math.abs(vocalAudio.currentTime - accompAudio.currentTime);
        if (drift > 0.03) { // only correct if > 30ms
          if (type === "vocal") {
            accompAudio.currentTime = vocalAudio.currentTime;
          } else {
            vocalAudio.currentTime = accompAudio.currentTime;
          }
          console.log(`🔄 Drift corrected after ${type} volume change. Drift was: ${drift.toFixed(3)}s`);
        }
      }
    } catch (err) {
      console.warn("⚠️ Drift correction skipped:", err);
    }
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta)).toFixed(2);
  slider.dispatchEvent(new Event("input"));
}

window.adjustVolume = adjustVolume;
