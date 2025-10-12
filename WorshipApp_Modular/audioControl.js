// audioControl.js — FULL REPLACEMENT (foolproof)

// Configuration
const MIN_VOL = 0.03;     // don't allow full mute
const DEFAULTS = { vocal: 0.03, accomp: 0.15 };

// Ensure global audio holders exist (songLoader likely assigns src later)
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

/**
 * Helper: find DOM slider / display nodes
 */
function getSlider(type) { return document.getElementById(`${type}Volume`); }
function getDisplay(type) { return document.getElementById(`${type}VolumeDisplay`); }

/**
 * Helper: set volume on all likely audio targets for a given type
 * - sets window.vocalAudio / window.accompAudio if present
 * - sets any <audio> elements whose id or data-* mention the type
 */
function setVolumeOnTargets(type, numericValue) {
  // 1) window audio object (primary target)
  try {
    const winAudio = (type === "vocal" ? window.vocalAudio : window.accompAudio);
    if (winAudio && typeof winAudio.volume === "number") {
      winAudio.volume = numericValue;
    }
  } catch (e) {
    console.warn("setVolumeOnTargets: failed writing to window audio", e);
  }

  // 2) any <audio> elements that look like they belong to this type
  const candidates = Array.from(document.querySelectorAll("audio"));
  const matched = [];
  candidates.forEach(a => {
    const id = (a.id || "").toLowerCase();
    const dataType = (a.dataset && a.dataset.type) ? a.dataset.type.toLowerCase() : "";
    const dataRole = a.getAttribute("data-role") || "";
    const other = (dataRole || "").toLowerCase();

    if (id.includes(type) || dataType.includes(type) || other.includes(type)) {
      try {
        a.volume = numericValue;
        matched.push(a);
      } catch (e) {
        // ignore
      }
    }
  });

  // Debug: what we changed
  console.debug(`[audioControl] set ${type} → ${numericValue} ; matched audio elements: ${matched.length}`);
}

/**
 * Synchronize slider value, numeric display, and real audio volumes for a type
 */
function syncDisplayAndVolume(type) {
  const slider = getSlider(type);
  const display = getDisplay(type);
  if (!slider) return;

  // coerce and clamp
  let val = parseFloat(slider.value);
  if (!Number.isFinite(val)) val = DEFAULTS[type] ?? MIN_VOL;
  val = Math.min(1, Math.max(MIN_VOL, val));

  // write back normalized value
  slider.value = val.toFixed(2);
  if (display) display.textContent = val.toFixed(2);

  // set on actual audio targets
  setVolumeOnTargets(type, val);

  console.log(`🎚️ [sync] ${type} = ${val.toFixed(2)}`);
}

/**
 * adjustVolume(type, delta) — global function used by + / - buttons
 * This updates the slider value *and* directly calls sync (so it never depends on synthetic events).
 */
function adjustVolume(type, delta) {
  const slider = getSlider(type);
  if (!slider) {
    console.warn("adjustVolume: slider not found for", type);
    return;
  }

  // change and clamp
  let newVal = parseFloat(slider.value) + delta;
  if (!Number.isFinite(newVal)) newVal = DEFAULTS[type] ?? MIN_VOL;
  newVal = Math.min(1, Math.max(MIN_VOL, newVal));
  slider.value = newVal.toFixed(2);

  // Immediately sync (this will update all audio targets and display)
  syncDisplayAndVolume(type);
}
window.adjustVolume = adjustVolume; // expose globally (keeps existing inline onclick handlers working)

/**
 * Setup: attach listeners and initialize defaults when DOM is ready
 */
function initAudioControls() {
  ["vocal", "accomp"].forEach(type => {
    const slider = getSlider(type);
    const display = getDisplay(type);

    if (!slider) {
      console.warn("initAudioControls: slider missing for", type);
      return;
    }

    // set initial default if empty/invalid
    let start = parseFloat(slider.value);
    if (!Number.isFinite(start)) start = DEFAULTS[type] ?? MIN_VOL;
    start = Math.min(1, Math.max(MIN_VOL, start));
    slider.value = start.toFixed(2);

    // attach listeners (user drag or keyboard)
    slider.addEventListener("input", () => syncDisplayAndVolume(type));
    slider.addEventListener("change", () => syncDisplayAndVolume(type));

    // also respond if some other script updates the slider programmatically via value
    // (MutationObserver for safety — rarely needed but harmless)
    const mo = new MutationObserver(() => syncDisplayAndVolume(type));
    mo.observe(slider, { attributes: true, attributeFilter: ["value"] });

    // initialize display + audio
    if (display) display.textContent = slider.value;
    syncDisplayAndVolume(type);
  });

  console.info("[audioControl] initialized (MIN_VOL=" + MIN_VOL + ")");
}

// Wait for DOM ready (safe if audioControl.js loaded before/after elements)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAudioControls, { once: true });
} else {
  // already ready
  initAudioControls();
}
