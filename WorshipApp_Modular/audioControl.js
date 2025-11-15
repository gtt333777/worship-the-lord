/* ============================================================
   Worship The Lord — audioControl.js
   🟩 FINAL STABLE BUILD  — Mute-Safe (Segment Boost Compatible)
   🔧 Startup ordering fixed: apply startup mute BEFORE slider init
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


/*
 // --- OLD: alternate mute detection (kept for reference) ---
 function isVocalMuted() {
   return window._muteMemory && typeof window._muteMemory.vocal === "number";
 }
*/

// --- NEW: Mute detection helper (flag-based, foolproof) ---
function isVocalMuted() {
  // Primary source of truth: explicit global boolean set by muteControl.js
  // Use !! to ensure it returns a boolean even if undefined.
  return !!window._vocalIsMuted;
}


// --- Core: set actual audio element volumes (single unified writer) ---
function setVolumeOnTargets(type, numericValue) {
  numericValue = Math.min(1, Math.max(MIN_VOL, parseFloat(numericValue.toFixed(2))));

  const targetAudio = (type === "vocal" ? window.vocalAudio : window.accompAudio);
  if (targetAudio && typeof targetAudio.volume === "number") targetAudio.volume = numericValue;

  document.querySelectorAll("audio").forEach(a => {
    const id = (a.id || "").toLowerCase();
    const role = (a.getAttribute("data-role") || "").toLowerCase();
    if (id.includes(type) || role.includes(type)) a.volume = numericValue;
  });

  const slider = getSlider(type);
  const display = getDisplay(type);
  if (slider) slider.value = numericValue.toFixed(2);
  if (display) display.textContent = numericValue.toFixed(2);
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
}

// --- adjustVolume: called by + / − buttons ---
function adjustVolume(type, delta) {
  const slider = getSlider(type);
  if (!slider) return;

  let newVal = parseFloat(slider.value) + delta;
  if (!Number.isFinite(newVal)) newVal = DEFAULTS[type] ?? MIN_VOL;
  newVal = Math.min(1, Math.max(MIN_VOL, newVal));

  slider.value = newVal.toFixed(2);
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
    slider.value = startVal.toFixed(2);

    slider.addEventListener("input", () => syncDisplayAndVolume(type));
    slider.addEventListener("change", () => syncDisplayAndVolume(type));

    if (display) display.textContent = slider.value;
    syncDisplayAndVolume(type);
  });
}


// =======================================================
//  ⚠️ EDIT: applyStartupMuteState + DOMContentLoaded ordering
//  We MUST apply the startup muted *state* before initializing sliders.
//  This avoids sliders or slider event handlers causing audible juggling.
// =======================================================

function applyStartupMuteState() {
  const defaults = { vocal: 0.002, accomp: 0.02 };

  // VOCAL — show default visually but keep real audio silent
  const vocalSlider = getSlider("vocal");
  const vocalDisplay = getDisplay("vocal");
  if (vocalSlider) {
    // Show the user's default visually (so the UI appears at default)
    vocalSlider.value = defaults.vocal.toFixed(2);
    if (vocalDisplay) vocalDisplay.textContent = defaults.vocal.toFixed(2);
  }

  // Set the internal saved/flag values and ensure real audio is silent
  window._savedVocalVolume = defaults.vocal; // will be restored on unmute
  window._vocalIsMuted = true;               // world: muted
  if (window.vocalAudio) {
    // Keep actual audio element effectively silent (tiny nonzero prevents some mobile edge cases)
    // Use 0.001 for UI consistency; setVolumeOnTargets would overwrite UI — we set element directly.
    window.vocalAudio.volume = 0.001;
  }

  // ACCOMP — set normal default (no mute)
  const accSlider = getSlider("accomp");
  if (accSlider && window.accompAudio) {
    accSlider.value = defaults.accomp.toFixed(2);
    // we don't emit input here — initAudioControls will attach events and sync cleanly
    window.accompAudio.volume = defaults.accomp;
  }
}


// Run applyStartupMuteState before initializing sliders and event listeners.
document.addEventListener("DOMContentLoaded", () => {
  // 1) Apply startup mute state (visual slider set, real audio muted, flags saved)
  applyStartupMuteState();

  // 2) Now initialize sliders and attach handlers — safe because audio is already set
  initAudioControls();
}, { once: true });

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
            // Apply boosted audio *only if not muted*
            if (!isVocalMuted()) setVolumeOnTargets("vocal", boosted);
            // Glow still runs regardless of mute
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

  // Hook boost scheduling to audio play (keep as-is)
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
