// ===========================
// audioControl.js (FINAL)
// ===========================

// --- Global audio elements ---
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

// --- Core adjustVolume used by +/- buttons ---
function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  if (!slider) return;

  // Clamp between 0 and 1
  let newVal = parseFloat(slider.value) + delta;
  newVal = Math.min(1, Math.max(0.03, newVal)); // never mute completely
  slider.value = newVal.toFixed(2);

  // Fire both input + change events so listeners react
  slider.dispatchEvent(new Event("input", { bubbles: true }));
  slider.dispatchEvent(new Event("change", { bubbles: true }));
}

window.adjustVolume = adjustVolume;

// --- Set default volumes on load ---
window.addEventListener("load", () => {
  const defaults = { vocal: 0.03, accomp: 0.15 };

  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);
    if (!slider || !audio) return;

    slider.value = defaults[type].toFixed(2);
    audio.volume = defaults[type];

    // Trigger initial sync
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

// --- Live Volume Display + Actual Control ---
(function setupVolumeDisplays() {
  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    const display = document.getElementById(`${type}VolumeDisplay`);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);
    if (!slider || !display || !audio) return;

    function syncDisplayAndVolume() {
      const val = parseFloat(slider.value).toFixed(2);
      display.textContent = val;
      audio.volume = parseFloat(val);
      console.log(`🎚️ ${type} volume set to ${val}`);
    }

    // Initialize display and audio
    syncDisplayAndVolume();

    // Keep everything in sync
    slider.addEventListener("input", syncDisplayAndVolume);
    slider.addEventListener("change", syncDisplayAndVolume);
  });
})();
