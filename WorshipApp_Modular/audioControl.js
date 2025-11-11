// =======================================================
//  audioControl.js — FINAL FOOLPROOF + VOCAL BOOST VERSION
//  🎨 Warm Gold → Peaceful Blue Glow Theme
//  ⚙️ Duplicate-Safe + Manual Segment Replay Support
// =======================================================

// --- Configuration ---
var MIN_VOL = 0.001;
window.DEFAULTS = window.DEFAULTS || { vocal: 0.0027, accomp: 0.03 };
var DEFAULTS = window.DEFAULTS;

// --- Ensure global audio elements (non-juggling) ---
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

// --- Core: set actual audio element volumes ---
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
  const defaults = { vocal: 0.0027, accomp: 0.03 };
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
//  🎤 Segment-Based Vocal Vitality Boost Logic (Non-Juggling)
//  🎨 Gold → Blue Glow Theme, Duplicate-Safe
// =======================================================
(function () {
  if (window.__VOCAL_VITALITY_BUILTIN__) return;
  window.__VOCAL_VITALITY_BUILTIN__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 5000;
  const END_RAISE_WINDOW = 4.0;
  const CHECK_INTERVAL = 100;
  const BOOST_DELAY = 100;
  const labelEl = document.querySelector('label[for="vocalVolume"]');

  // ✨ Glow style
  function setGlow(mode) {
    if (!labelEl) return;
    labelEl.style.transition = "box-shadow 0.4s ease, background 0.4s ease";
    labelEl.style.borderRadius = "8px";
    if (mode === "start") {
      labelEl.style.boxShadow = "0 0 20px 6px rgba(255,213,79,0.9)";
      labelEl.style.background = "linear-gradient(to right,#fffde7,#fff59d)";
    } else if (mode === "end") {
      labelEl.style.boxShadow = "0 0 20px 6px rgba(100,181,246,0.9)";
      labelEl.style.background = "linear-gradient(to right,#e3f2fd,#bbdefb)";
    } else {
      labelEl.style.boxShadow = "";
      labelEl.style.background = "";
    }
  }

  // --- Helper: Clear old boost watchers before starting new ones ---
  function clearExistingBoostWatchers() {
    const list = window.__VOCAL_BOOST_WATCHERS__ || [];
    list.forEach(id => { try { clearInterval(id); } catch(e) {} });
    window.__VOCAL_BOOST_WATCHERS__ = [];
  }

  function scheduleBoosts() {
    // 🧹 Clean any leftover watchers
    clearExistingBoostWatchers();

    if (window.__VOCAL_BOOST_ACTIVE__) {
      console.warn("⚠️ Duplicate boost logic suppressed");
      return;
    }
    window.__VOCAL_BOOST_ACTIVE__ = true;

    if (!window.vocalAudio || !Array.isArray(window.segments)) return;
    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");

    if (s) {
      const initialVal = parseFloat(s.value) || (DEFAULTS.vocal ?? MIN_VOL);
      setVolumeOnTargets("vocal", initialVal);
      console.log("🔄 Vocal volume initialized to", initialVal);
    }

    console.log("🎵 Built-in Vocal Vitality Boost active...");

    window.__VOCAL_BOOST_WATCHERS__ = [];

    window.segments.forEach((seg, i) => {
      seg._boosted = seg._fadedUp = seg._reset = false;
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;
        const currentSlider = document.getElementById("vocalVolume");
        let base = parseFloat(currentSlider?.value) || 0.0;
        let boosted = (base <= 0.003) ? 0.02 : base * 1.25;
        boosted = Math.min(1, boosted);

        // stop old watcher safely
        if (cur > seg.end + 0.5) {
          seg._reset = seg._boosted = seg._fadedUp = true;
          clearInterval(watcher);
          return;
        }

        // 🚀 Boost
        if (cur >= seg.start && cur < seg.start + 1.0 && !seg._boosted && cur < seg.end - 1.0) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost (base=${base.toFixed(4)}, boosted=${boosted.toFixed(4)})`);
          setTimeout(() => {
            setVolumeOnTargets("vocal", boosted);
            setGlow("start");
          }, BOOST_DELAY);

          setTimeout(() => {
            if (a.paused) return;
            setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // 🔄 End raise
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
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
          setVolumeOnTargets("vocal", base);
          setGlow(null);
          clearInterval(watcher);
        }

        if (cur - seg.start > 2.0 && !seg._boosted) seg._boosted = true;
      }, CHECK_INTERVAL);

      window.__VOCAL_BOOST_WATCHERS__.push(watcher);
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

  console.log("🎤 Built-in Vocal Vitality Boost logic — strict start/end synced (gold→blue).");
})();
