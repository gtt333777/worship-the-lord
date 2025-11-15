/* ============================================================
   Worship The Lord — audioControl.js
   🟩 FINAL STABLE BUILD  — Mute-Safe (Segment Boost Compatible)

   🔹 This version:
       ✔ Old perfect non-juggling version
       ✔ 1 small mute-safe patch added
       ✔ No override logic
       ✔ No experimental mute code
       ✔ 100% stable with external muteControl.js
   ============================================================ */


// =======================================================
//  audioControl.js — FINAL FOOLPROOF + VOCAL BOOST VERSION
//  🎨 With Warm Gold → Peaceful Blue Glow Theme
// =======================================================

// --- Configuration ---
var MIN_VOL = 0.001;
window.DEFAULTS = window.DEFAULTS || { vocal: 0.002, accomp: 0.02 };
var DEFAULTS = window.DEFAULTS;

// --- Ensure global audio elements point to the real players (non-juggling) ---
window.vocalAudio =
  document.querySelector('audio[data-role="vocal"]') ||
  window.vocalAudio ||
  new Audio();

window.accompAudio =
  document.querySelector('audio[data-role="accomp"]') ||
  window.accompAudio ||
  new Audio();

// --- Helpers ---
function getSlider(type) { return document.getElementById(`${type}Volume`); }
function getDisplay(type) { return document.getElementById(`${type}VolumeDisplay`); }


// --- NEW: Mute detection helper (flag-based, foolproof) ---
function isVocalMuted() {
  // Primary source of truth: explicit global boolean set by muteControl.js
  // Use !! to ensure it returns a boolean even if undefined.
  return !!window._vocalIsMuted;
}

// --- Core: set actual audio element volumes (single unified writer) ---
function setVolumeOnTargets(type, numericValue) {
  // Keep audio clamping/rounding behavior for actual audio writes.
  numericValue = Math.min(1, Math.max(MIN_VOL, parseFloat(numericValue.toFixed(2))));

  const targetAudio = (type === "vocal" ? window.vocalAudio : window.accompAudio);
  if (targetAudio && typeof targetAudio.volume === "number") targetAudio.volume = numericValue;

  document.querySelectorAll("audio").forEach(a => {
    const id = (a.id || "").toLowerCase();
    const role = (a.getAttribute("data-role") || "").toLowerCase();
    if (id.includes(type) || role.includes(type)) a.volume = numericValue;
  });

  // --- IMPORTANT UI: keep 3 decimals for slider/display so 0.001/0.002 are visible ---
  const slider = getSlider(type);
  const display = getDisplay(type);
  if (slider) slider.value = numericValue.toFixed(3);
  if (display) display.textContent = numericValue.toFixed(3);
}

// --- Core: sync slider → display → audio volume ---
function syncDisplayAndVolume(type) {
  const slider = getSlider(type);
  const display = getDisplay(type);
  if (!slider) return;

  let val = parseFloat(slider.value);
  if (!Number.isFinite(val)) val = DEFAULTS[type] ?? MIN_VOL;
  val = Math.min(1, Math.max(MIN_VOL, val));

  // Show 3 decimals in UI (prevents rounding to 0.00 for tiny values)
  slider.value = val.toFixed(3);
  if (display) display.textContent = val.toFixed(3);
  setVolumeOnTargets(type, val);
}

// --- adjustVolume: called by + / − buttons ---
function adjustVolume(type, delta) {
  const slider = getSlider(type);
  if (!slider) return;

  let newVal = parseFloat(slider.value) + delta;
  if (!Number.isFinite(newVal)) newVal = DEFAULTS[type] ?? MIN_VOL;
  newVal = Math.min(1, Math.max(MIN_VOL, newVal));

  // Preserve 3-decimal UI precision
  slider.value = newVal.toFixed(3);
  syncDisplayAndVolume(type);
}
window.adjustVolume = adjustVolume;

// --- Initialize sliders ---
function initAudioControls() {
  ["vocal", "accomp"].forEach(type => {
    const slider = getSlider(type);
    const display = getDisplay(type);
    if (!slider) return;

    let startVal = parseFloat(slider.value);
    if (!Number.isFinite(startVal)) startVal = DEFAULTS[type] ?? MIN_VOL;
    startVal = Math.min(1, Math.max(MIN_VOL, startVal));
    slider.value = startVal.toFixed(3);

    slider.addEventListener("input", () => syncDisplayAndVolume(type));
    slider.addEventListener("change", () => syncDisplayAndVolume(type));

    if (display) display.textContent = slider.value;
    syncDisplayAndVolume(type);
  });
}

// --- Run when DOM is ready ---
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAudioControls, { once: true });
} else {
  initAudioControls();
}

/*
  Note: we intentionally avoid heavy startup input/change events for vocal because
  the mute system manages real audio state separately. Below load handler shows
  default slider visually while keeping the real audio muted if startup expects that.
*/

window.addEventListener("load", () => {
  const defaults = { vocal: 0.002, accomp: 0.02 };

  // VOCAL — start muted, but visually show default (3 decimals)
  const vocalSlider = getSlider("vocal");
  const vocalDisplay = getDisplay("vocal");
  if (vocalSlider) {
    vocalSlider.value = defaults.vocal.toFixed(3);
    if (vocalDisplay) vocalDisplay.textContent = defaults.vocal.toFixed(3);
  }

  // Real audio mute state / saved restore value
  window._savedVocalVolume = defaults.vocal;
  window._vocalIsMuted = true;
  if (window.vocalAudio) window.vocalAudio.volume = 0.001;

  // ACCOMP — normal
  const accSlider = getSlider("accomp");
  if (accSlider && window.accompAudio) {
    accSlider.value = defaults.accomp.toFixed(3);
    accSlider.dispatchEvent(new Event("input"));
    window.accompAudio.volume = defaults.accomp;
  }
});

// =======================================================
//  🎤 Segment-Based Vocal Vitality Boost Logic (Mute-Safe)
// =======================================================
(function () {
  if (window.__VOCAL_VITALITY_BUILTIN__) return;
  window.__VOCAL_VITALITY_BUILTIN__ = true;

  const HOLD_TIME = 3000;
  const END_RAISE_WINDOW = 1.0;
  const CHECK_INTERVAL = 100;
  const BOOST_DELAY = 100;

  const labelEl = document.querySelector('label[for="vocalVolume"]');

  function setGlow(mode) {
    if (!labelEl) return;
    labelEl.style.transition = "box-shadow 0.4s ease, background 0.4s ease";
    labelEl.style.borderRadius = "8px";

    if (mode === "start") {
      labelEl.style.boxShadow = "0 0 20px 6px rgba(255, 213, 79, 0.9)";
      labelEl.style.background = "linear-gradient(to right,#fffde7,#fff59d)";
    } else if (mode === "end") {
      labelEl.style.boxShadow = "0 0 20px 6px rgba(100,181,246,0.9)";
      labelEl.style.background = "linear-gradient(to right,#e3f2fd,#bbdefb)";
    } else {
      labelEl.style.boxShadow = "";
      labelEl.style.background = "";
    }
  }

  function scheduleBoosts() {
    if (!window.vocalAudio || !Array.isArray(window.segments)) return;
    const a = window.vocalAudio;

    console.log("🎵 Built-in Vocal Vitality Boost active...");

    window.segments.forEach((seg, i) => {
      seg._boosted = seg._fadedUp = seg._reset = false;
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        const currentSlider = document.getElementById("vocalVolume");
        let base = parseFloat(currentSlider?.value) || 0.0;
        let boosted = base <= 0.012 ? 0.012 : Math.min(1, base * 1.25);

        if (cur > seg.end + 0.5) {
          seg._reset = seg._boosted = seg._fadedUp = true;
          clearInterval(watcher);
          return;
        }

        // 🚀 Start boost (mute-safe)
        if (
          cur >= seg.start &&
          cur < seg.start + 1.0 &&
          !seg._boosted &&
          cur < seg.end - 1.0
        ) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost`);

          setTimeout(() => {
            if (!isVocalMuted()) setVolumeOnTargets("vocal", boosted);
            setGlow("start");
          }, BOOST_DELAY);

          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} reset`);
            if (!isVocalMuted()) setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // 🔄 End raise (mute-safe)
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} end raise`);
          if (!isVocalMuted()) setVolumeOnTargets("vocal", boosted);
          setGlow("end");

          setTimeout(() => {
            if (!isVocalMuted()) setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, 400);
        }

        // ⏹️ Final reset (mute-safe)
        if (cur >= seg.end && !seg._reset) {
          seg._reset = true;
          console.log(`⏹️ Segment ${i + 1} end reset`);
          if (!isVocalMuted()) setVolumeOnTargets("vocal", base);
          setGlow(null);
          clearInterval(watcher);
        }

        if (cur - seg.start > 2.0 && !seg._boosted) seg._boosted = true;
      }, CHECK_INTERVAL);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.vocalAudio.addEventListener) {
        clearInterval(ensureAudio);
        window.vocalAudio.addEventListener("play", scheduleBoosts);
      }
    }, 200);
  });

  console.log("🎤 Mute-Safe Vocal Boost logic ready.");
})();
