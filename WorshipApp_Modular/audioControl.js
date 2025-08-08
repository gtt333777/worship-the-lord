// audioControl.js

// Global audio elements
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

// Delay timer for smooth drift correction
let driftCorrectionTimer = null;

["vocal", "accomp"].forEach(type => {
  const slider = document.getElementById(`${type}Volume`);

  slider.addEventListener("input", e => {
    const audioEl = (type === "vocal" ? vocalAudio : accompAudio);
    audioEl.volume = parseFloat(e.target.value);

    // Clear previous drift correction request
    if (driftCorrectionTimer) clearTimeout(driftCorrectionTimer);

    // Schedule drift correction shortly after volume change stops
    driftCorrectionTimer = setTimeout(() => {
      correctDrift();
    }, 50); // wait 50ms to avoid sluggishness
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta)).toFixed(2);
  slider.dispatchEvent(new Event("input"));
}

window.adjustVolume = adjustVolume;

// Smooth drift correction function
function correctDrift() {
  if (!vocalAudio || !accompAudio) return;

  // Only correct if both are ready & playing
  if (vocalAudio.readyState < 2 || accompAudio.readyState < 2) return;
  if (vocalAudio.paused || accompAudio.paused) return;

  const drift = vocalAudio.currentTime - accompAudio.currentTime;

  // Ignore tiny drifts below 0.03s
  if (Math.abs(drift) > 0.03) {
    if (drift > 0) {
      accompAudio.currentTime = vocalAudio.currentTime;
    } else {
      vocalAudio.currentTime = accompAudio.currentTime;
    }
    console.log(`🔄 Drift corrected after volume change. Drift was: ${drift.toFixed(3)}s`);
  }
}
