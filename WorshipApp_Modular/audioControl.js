// =======================================================
//  audioControl.js — FINAL FOOLPROOF VERSION
// =======================================================

// --- Configuration ---
var MIN_VOL = 0.03; // never mute completely
window.DEFAULTS = window.DEFAULTS || { vocal: 0.03, accomp: 0.15 };
var DEFAULTS = window.DEFAULTS;

console.log("[audioControl] DEFAULTS =", DEFAULTS, "MIN_VOL =", MIN_VOL);

// --- Ensure global audio elements exist ---
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

// --- Helpers ---
function getSlider(type) {
  return document.getElementById(`${type}Volume`);
}
function getDisplay(type) {
  return document.getElementById(`${type}VolumeDisplay`);
}

// --- Core: set actual audio element volumes ---
function setVolumeOnTargets(type, numericValue) {
  try {
    const targetAudio = (type === "vocal" ? window.vocalAudio : window.accompAudio);
    if (targetAudio && typeof targetAudio.volume === "number") {
      targetAudio.volume = numericValue;
    }
  } catch (err) {
    console.warn("⚠️ setVolumeOnTargets error:", err);
  }

  // Also apply to any <audio> elements matching the type
  document.querySelectorAll("audio").forEach(a => {
    const id = (a.id || "").toLowerCase();
    const role = (a.getAttribute("data-role") || "").toLowerCase();
    if (id.includes(type) || role.includes(type)) {
      a.volume = numericValue;
    }
  });
}

// --- Core: sync slider → display → audio volume ---
function syncDisplayAndVolume(type) {
  const slider = getSlider(type);
  const display = getDisplay(type);
  if (!slider) return;

  let val = parseFloat(slider.value);
  if (!Number.isFinite(val)) val = DEFAULTS[type] ?? MIN_VOL;
  val = Math.min(1, Math.max(MIN_VOL, val));

  slider.value = val.toFixed(2);
  if (display) display.textContent = val.toFixed(2);

  setVolumeOnTargets(type, val);
  console.log(`🎚️ [${type}] volume = ${val.toFixed(2)}`);
}

// --- adjustVolume: called by + / − buttons ---
function adjustVolume(type, delta) {
  const slider = getSlider(type);
  if (!slider) {
    console.warn("⚠️ adjustVolume: slider missing for", type);
    return;
  }

  let newVal = parseFloat(slider.value) + delta;
  if (!Number.isFinite(newVal)) newVal = DEFAULTS[type] ?? MIN_VOL;
  newVal = Math.min(1, Math.max(MIN_VOL, newVal));

  slider.value = newVal.toFixed(2);
  syncDisplayAndVolume(type); // immediate apply
}
window.adjustVolume = adjustVolume;

// --- Initialize sliders and event listeners ---
function initAudioControls() {
  ["vocal", "accomp"].forEach(type => {
    const slider = getSlider(type);
    const display = getDisplay(type);
    if (!slider) {
      console.warn("⚠️ initAudioControls: missing slider for", type);
      return;
    }

    // Apply default if slider empty
    let startVal = parseFloat(slider.value);
    if (!Number.isFinite(startVal)) startVal = DEFAULTS[type] ?? MIN_VOL;
    startVal = Math.min(1, Math.max(MIN_VOL, startVal));
    slider.value = startVal.toFixed(2);

    // Attach listeners
    slider.addEventListener("input", () => syncDisplayAndVolume(type));
    slider.addEventListener("change", () => syncDisplayAndVolume(type));

    // Initialize now
    if (display) display.textContent = slider.value;
    syncDisplayAndVolume(type);
  });

  console.info("[audioControl] initialized ✅ (MIN_VOL=" + MIN_VOL + ")");
}

// --- Run when DOM is ready ---
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAudioControls, { once: true });
} else {
  initAudioControls();
}


// --- Set initial volumes on load ---
window.addEventListener("load", () => {
  const defaults = {
    vocal: 0.03,
    accomp: 0.15
  };

  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);

    if (slider && audio) {
      slider.value = defaults[type].toFixed(2);
      audio.volume = defaults[type];
      // Fire an input event so UI stays in sync
      slider.dispatchEvent(new Event("input"));
    }
  });
});
