// audioControl.js — Using Web Audio API GainNodes to prevent sync drift

// Create the AudioContext once
if (!window.audioCtx) {
  window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Create global audio elements and gain nodes
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

// Hook sliders to gain nodes instead of element.volume
["vocal", "accomp"].forEach(type => {
  const slider = document.getElementById(`${type}Volume`);
  if (slider) {
    slider.addEventListener("input", e => {
      const gainNode = (type === "vocal") ? window.vocalGain : window.accompGain;
      gainNode.gain.value = parseFloat(e.target.value);
    });
  }
});

// Adjust volume with +/- buttons
function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  if (slider) {
    let newValue = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
    slider.value = newValue.toFixed(2);
    slider.dispatchEvent(new Event("input"));
  }
}
window.adjustVolume = adjustVolume;

// Optional: ensure AudioContext is resumed on user interaction (browser policy)
document.addEventListener("click", () => {
  if (window.audioCtx.state === "suspended") {
    window.audioCtx.resume();
  }
});
