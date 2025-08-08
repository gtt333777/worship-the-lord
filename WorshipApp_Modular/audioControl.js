// audioControl.js — Drift-free, working volume control with AudioContext + GainNode

// 1️⃣ Create AudioContext only once, global scope
if (!window.audioCtx) {
  window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// 2️⃣ Create global Audio elements & GainNodes (only once)
if (!window.vocalAudio) {
  window.vocalAudio = new Audio();
  window.vocalAudio.crossOrigin = "anonymous";

  const vocalSource = window.audioCtx.createMediaElementSource(window.vocalAudio);
  window.vocalGain = window.audioCtx.createGain();
  vocalSource.connect(window.vocalGain).connect(window.audioCtx.destination);
}

if (!window.accompAudio) {
  window.accompAudio = new Audio();
  window.accompAudio.crossOrigin = "anonymous";

  const accompSource = window.audioCtx.createMediaElementSource(window.accompAudio);
  window.accompGain = window.audioCtx.createGain();
  accompSource.connect(window.accompGain).connect(window.audioCtx.destination);
}

// 3️⃣ Wait for DOM so sliders exist before attaching events
document.addEventListener("DOMContentLoaded", function () {
  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    if (slider) {
      slider.addEventListener("input", e => {
        const gainNode = (type === "vocal") ? window.vocalGain : window.accompGain;
        gainNode.gain.value = parseFloat(e.target.value);
      });
    }
  });
});

// 4️⃣ Adjust volume via +/- buttons without breaking sync
function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  if (slider) {
    let newValue = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
    slider.value = newValue.toFixed(2);
    slider.dispatchEvent(new Event("input"));
  }
}
window.adjustVolume = adjustVolume;

// 5️⃣ Resume AudioContext on first click/touch (required by browsers)
document.addEventListener("click", () => {
  if (window.audioCtx && window.audioCtx.state === "suspended") {
    window.audioCtx.resume();
  }
});
document.addEventListener("touchstart", () => {
  if (window.audioCtx && window.audioCtx.state === "suspended") {
    window.audioCtx.resume();
  }
});
