/* ============================================================
   Worship The Lord — audioControl.js
   🟩 FINAL STABLE BUILD  — Verified 2025-11-12

   🔹 Purpose:
       Global audio volume control + Vocal Vitality Boost system
       (Glow / Boost / Drop with peaceful blue–gold theme)

   🔹 Highlights:
       • Duplicate loop permanently removed ✅
       • Volume sync on startup restored (cleanly)
       • Boost logic dynamically adapts to slider value
       • Manual & automatic segment playback supported
       • Fully non-juggling — no overlapping watchers
       • Compatible with songLoader.js, loopPlayer.js, etc.
       • Classic modular structure (no imports/exports)

   🔹 Maintenance Tips:
       • To test glow/boost, watch console for:
         🚀 boost → ⬇️ reset → 🔄 end raise → ⏹️ end reset
       • If future edits reintroduce segment watchers,
         ensure only one window.segments.forEach() block exists.

   — GTG-333 verified build (11-Nov-2025, India time)
   ============================================================ */


// =======================================================
//  audioControl.js — FINAL FOOLPROOF + VOCAL BOOST VERSION
//  🎨 With Warm Gold → Peaceful Blue Glow Theme
// =======================================================

// --- Configuration ---
var MIN_VOL = 0.001;
window.DEFAULTS = window.DEFAULTS || { vocal: 0.002, accomp: 0.02 };
var DEFAULTS = window.DEFAULTS;
/*
// --- Ensure global audio elements exist ---
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();
*/

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

// --- Set initial volumes on load ---
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
});



// =======================================================
// 🔇 Mute / Unmute system (added safely here)
// =======================================================
function toggleMute(type) {
  if (!window._muteMemory) window._muteMemory = {};

  const audio = (type === "vocal") ? window.vocalAudio : window.accompAudio;
  const slider = getSlider(type);
  const display = getDisplay(type);
  const btn = document.getElementById(type + "MuteBtn"); // button id: 'vocalMuteBtn' or 'accompMuteBtn'

  if (!audio || !slider) return;

  if (!window._muteMemory[type]) {
    window._muteMemory[type] = audio.volume;
    audio.volume = 0;
    slider.value = "0.00";
    if (display) display.textContent = "0.00";
    if (btn) btn.textContent = "🔇 Unmute";
    return;
  }

  audio.volume = window._muteMemory[type];
  slider.value = window._muteMemory[type].toFixed(3);
  if (display) display.textContent = window._muteMemory[type].toFixed(3);
  window._muteMemory[type] = null;
  if (btn) btn.textContent = "🔊 Mute";
}
window.toggleMute = toggleMute;


// =======================================================
// 🔇 Make Vocal muted by default (outside load-block)
// =======================================================
window._muteMemory = window._muteMemory || {};
window._muteMemory.vocal = 0.002;

if (window.vocalAudio) window.vocalAudio.volume = 0;
if (document.getElementById("vocalVolume"))
  document.getElementById("vocalVolume").value = "0.00";
if (document.getElementById("vocalVolumeDisplay"))
  document.getElementById("vocalVolumeDisplay").textContent = "0.00";

// set initial icon + text states if buttons exist
if (document.getElementById("vocalMuteBtn")) {
  document.getElementById("vocalMuteBtn").textContent = "🔇 Unmute";
}
if (document.getElementById("accompMuteBtn")) {
  document.getElementById("accompMuteBtn").textContent = "🔊 Mute";
}



 // =======================================================
 //  🎤 Segment-Based Vocal Vitality Boost Logic (Non-Juggling)
 //  🎨 Warm Gold → Peaceful Blue Glow Theme
 //  ⏱️ Strictly fires at segment boundaries — duplicate loop removed
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
   🔇 Silent-Boost Patch (Option C) — FIXED VERSION
   If Vocal is muted -> boost logic still runs,
   but actual audio volume stays 0.00
   ======================================================= */

(function () {
  const origSetVolume = window.setVolumeOnTargets;

  window.setVolumeOnTargets = function(type, numericValue) {

    // If vocal is muted (button contains 🔇 anywhere)
    if (type === "vocal") {
      const btn = document.getElementById("vocalMuteBtn");
      const isMuted = btn && btn.textContent.includes("🔇");

      if (isMuted) {
        // Keep display + slider at zero
        const slider = document.getElementById("vocalVolume");
        const display = document.getElementById("vocalVolumeDisplay");

        if (slider) slider.value = "0.00";
        if (display) display.textContent = "0.00";

        // Force actual audio silent
        if (window.vocalAudio) window.vocalAudio.volume = 0;

        return; // DO NOT allow boosted volume
      }
    }

    // Normal behaviour when not muted
    origSetVolume(type, numericValue);
  };
})();
