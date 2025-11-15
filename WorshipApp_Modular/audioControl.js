/* ============================================================
   Worship The Lord — audioControl.js
   🟩 MERGED: Old stable core + Mute/Unmute integration (no juggling)
   Verified merge — 2025-11-15

   🔹 This file preserves the OLD stable implementation and
      integrates the Mute/Unmute system safely (no juggling).
   ============================================================ */

/* =======================================================
   audioControl.js — FINAL FOOLPROOF + VOCAL BOOST VERSION
   🎨 With Warm Gold → Peaceful Blue Glow Theme
   ======================================================= */

// --- Configuration ---
var MIN_VOL = 0.001;
window.DEFAULTS = window.DEFAULTS || { vocal: 0.002, accomp: 0.02 };
var DEFAULTS = window.DEFAULTS;

/* --- Ensure global audio elements point to the real players (non-juggling) --- */
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
window.setVolumeOnTargets = setVolumeOnTargets; // keep global reference

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

// --- Initialize sliders and event listeners ---
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

// --- Run when DOM is ready ---
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAudioControls, { once: true });
} else {
  initAudioControls();
}

// --- Set initial volumes on load (keeps old stable behaviour) ---
window.addEventListener("load", () => {
  const defaults = { vocal: 0.002, accomp: 0.02 };
  ["vocal", "accomp"].forEach(type => {
    const slider = getSlider(type);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);
    if (slider && audio) {
      slider.value = defaults[type].toFixed(2);
      audio.volume = defaults[type];
      slider.dispatchEvent(new Event("input"));
    }
  });

  // After initial slider sync and audio defaults have been applied,
  // ensure any saved mute state is reflected in UI and real audio.
  applyStartupMuteState();
});

// =======================================================
// 🔇 Mute / Unmute system (robust — uses _muteMemory + debounce)
//   - toggleMute(type) globally available
// =======================================================
(function(){
  // simple debounce guard (ms)
  const TOGGLE_DEBOUNCE_MS = 300;

  // ensure global _muteMemory exists
  window._muteMemory = window._muteMemory || {};

  // store last toggle timestamp globally to avoid rapid toggles
  if (!window._lastMuteToggleAt) window._lastMuteToggleAt = 0;

  window.toggleMute = function(type) {
    if (!window._muteMemory) window._muteMemory = {};

    const now = Date.now();
    if (now - window._lastMuteToggleAt < TOGGLE_DEBOUNCE_MS) {
      // ignore too-fast toggles
      console.warn("toggleMute debounced");
      return;
    }
    window._lastMuteToggleAt = now;

    const audio = (type === "vocal") ? window.vocalAudio : window.accompAudio;
    const slider = getSlider(type);
    const display = getDisplay(type);
    const btn = document.getElementById(type + "MuteBtn"); // expects 'vocalMuteBtn' or 'accompMuteBtn'

    if (!audio || !slider) return;

    // If currently muted: _muteMemory[type] is a number (restore value)
    if (typeof window._muteMemory[type] === "number") {
      // Unmute: restore saved non-zero value (or DEFAULTS[type] fallback)
      let restore = window._muteMemory[type];
      if (!Number.isFinite(restore) || restore <= MIN_VOL) {
        restore = DEFAULTS[type] ?? MIN_VOL;
      }

      // Apply restore
      audio.volume = restore;
      slider.value = restore.toFixed(2);
      if (display) display.textContent = restore.toFixed(2);

      // mark as unmuted
      window._muteMemory[type] = null;

      if (btn) btn.textContent = "🔊 Mute";
      return;
    }

    // Else: currently unmuted — mute now and save meaningful restore value
    // Prefer current slider value (if > MIN_VOL), else audio.volume, else DEFAULTS[type]
    let saveVal = DEFAULTS[type] ?? MIN_VOL;
    const sliderVal = parseFloat(slider.value);
    if (Number.isFinite(sliderVal) && sliderVal > MIN_VOL) {
      saveVal = Math.max(MIN_VOL, parseFloat(sliderVal.toFixed(3)));
    } else if (typeof audio.volume === "number" && audio.volume > MIN_VOL) {
      saveVal = Math.max(MIN_VOL, parseFloat(audio.volume.toFixed(3)));
    } else {
      saveVal = DEFAULTS[type] ?? MIN_VOL;
    }

    // store the restore value (number) to mark muted state
    window._muteMemory[type] = saveVal;

    // Apply actual silence (audio = 0.0), but show 0.001 in UI to avoid juggling
    audio.volume = 0;
    slider.value = "0.001";
    if (display) display.textContent = "0.001";

    if (btn) btn.textContent = "🔇 Unmute";
  };
})();

// =======================================================
// Startup helper: apply saved mute state after init (safe)
// - Keeps UI at tiny nonzero (0.001) while real audio is silent (0.0)
// - Runs after load (so slider elements and event listeners exist)
// =======================================================
function applyStartupMuteState() {
  try {
    if (!window._muteMemory) window._muteMemory = {};

    // Vocal
    if (typeof window._muteMemory.vocal === "number") {
      const vSlider = document.getElementById("vocalVolume");
      const vDisplay = document.getElementById("vocalVolumeDisplay");
      const vBtn = document.getElementById("vocalMuteBtn");

      if (window.vocalAudio) window.vocalAudio.volume = 0;
      if (vSlider) vSlider.value = "0.001";
      if (vDisplay) vDisplay.textContent = "0.001";
      if (vBtn) vBtn.textContent = "🔇 Unmute";
    }

    // Accompaniment (if you want to support accompan. mute on startup)
    if (typeof window._muteMemory.accomp === "number") {
      const aSlider = document.getElementById("accompVolume");
      const aDisplay = document.getElementById("accompVolumeDisplay");
      const aBtn = document.getElementById("accompMuteBtn");

      if (window.accompAudio) window.accompAudio.volume = 0;
      if (aSlider) aSlider.value = "0.001";
      if (aDisplay) aDisplay.textContent = "0.001";
      if (aBtn) aBtn.textContent = "🔇 Unmute";
    }
  } catch (e) {
    console.warn("applyStartupMuteState failed:", e);
  }
}

// =======================================================
//  🎤 Segment-Based Vocal Vitality Boost Logic (Non-Juggling)
//  🎨 Warm Gold → Peaceful Blue Glow Theme
//  ⏱️ Strictly fires at segment boundaries — duplicate loop removed
// =======================================================
(function () {
  if (window.__VOCAL_VITALITY_BUILTIN__) return;
  window.__VOCAL_VITALITY_BUILTIN__ = true;

  const HOLD_TIME = 3000;          // hold 3s
  const END_RAISE_WINDOW = 1.0;    // seconds before end
  const CHECK_INTERVAL = 100;      // check rate
  const BOOST_DELAY = 100;         // small delay for smooth start

  const labelEl = document.querySelector('label[for="vocalVolume"]');

  // ✨ Dual-color glow
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

    // ✅ For each segment, use live base and boosted from current slider value
    window.segments.forEach((seg, i) => {
      seg._boosted = seg._fadedUp = seg._reset = false;
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        // --- Recalculate base and boosted dynamically
        const currentSlider = document.getElementById("vocalVolume");
        let base = parseFloat(currentSlider?.value) || 0.0;
        let boosted = base <= 0.012 ? 0.012 : Math.min(1, base * 1.25);

        // --- Safety cutoff
        if (cur > seg.end + 0.5) {
          seg._reset = seg._boosted = seg._fadedUp = true;
          clearInterval(watcher);
          return;
        }

        // 🚀 Boost at start
        if (
          cur >= seg.start &&
          cur < seg.start + 1.0 &&
          !seg._boosted &&
          cur < seg.end - 1.0
        ) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost (base=${base.toFixed(4)}, boosted=${boosted.toFixed(4)})`);
          setTimeout(() => {
            setVolumeOnTargets("vocal", boosted);
            setGlow("start");
          }, BOOST_DELAY);

          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} reset`);
            setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // 🔄 Raise near end
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} end raise (boosted=${boosted.toFixed(4)})`);
          setVolumeOnTargets("vocal", boosted);
          setGlow("end");

          setTimeout(() => {
            setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, 400);
        }

        // ⏹️ Reset at end
        if (cur >= seg.end && !seg._reset) {
          seg._reset = true;
          console.log(`⏹️ Segment ${i + 1} end reset`);
          setVolumeOnTargets("vocal", base);
          setGlow(null);
          clearInterval(watcher);
        }

        if (cur - seg.start > 2.0 && !seg._boosted) seg._boosted = true;
      }, CHECK_INTERVAL);
    });
  }

  // --- Hook boost scheduling to playback start ---
  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.vocalAudio.addEventListener) {
        clearInterval(ensureAudio);
        window.vocalAudio.addEventListener("play", scheduleBoosts);
      }
    }, 200);
  });

  console.log("🎤 Built-in Vocal Vitality Boost logic — strictly start/end synced (gold→blue, no duplicate loop).");
})();

/* =======================================================
   Silent-Boost wrapper (uses internal mute state)
   - Prevents boosted volume from being applied audibly while muted
   - Uses window._muteMemory.vocal as source-of-truth
   - Minimal, safe override placed at end
   ======================================================= */
(function () {
  // keep reference to original
  const origSetVolume = window.setVolumeOnTargets;

  window.setVolumeOnTargets = function(type, numericValue) {
    try {
      // intervene only for vocal
      if (type === "vocal") {
        const isMutedInternal = window._muteMemory && typeof window._muteMemory.vocal === "number";

        if (isMutedInternal) {
          // Keep slider/display at 0.001 and force audio element silent (real silence)
          const slider = document.getElementById("vocalVolume");
          const display = document.getElementById("vocalVolumeDisplay");
          if (slider) slider.value = "0.001";
          if (display) display.textContent = "0.001";
          if (window.vocalAudio) window.vocalAudio.volume = 0;

          // Do NOT pass boosted volume to original function
          return;
        }
      }
    } catch (e) {
      // If anything goes wrong, fallback to default behaviour below
      console.warn("Silent-Boost wrapper encountered error:", e);
    }

    // default behaviour for accompaniment and unmuted vocal
    return origSetVolume(type, numericValue);
  };
})();

/* =======================================================
   End of file
   - No duplicate loops, no racing initialization.
   - Mute state applied AFTER initial slider sync (applyStartupMuteState).
   ======================================================= */
