// =======================================================
//  audioControl.js — FINAL FOOLPROOF + VOCAL BOOST VERSION
//  🎨 With Warm Gold → Peaceful Blue Glow Theme
// =======================================================

// --- Configuration ---
var MIN_VOL = 0.001;
window.DEFAULTS = window.DEFAULTS || { vocal: 0.0027, accomp: 0.03 };
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
//  🎨 Warm Gold → Peaceful Blue Glow Theme
// =======================================================
/*
(function () {
  if (window.__VOCAL_VITALITY_BUILTIN__) return;
  window.__VOCAL_VITALITY_BUILTIN__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;          // hold 3s
  const END_RAISE_WINDOW = 2.0;    // seconds before end
  const CHECK_INTERVAL = 200;
  const BOOST_DELAY = 120;

  const labelEl = document.querySelector('label[for="vocalVolume"]');

  // ✨ Enhanced dual-color glow function
  function setGlow(mode) {
    if (!labelEl) return;
    labelEl.style.transition = "box-shadow 0.4s ease, background 0.4s ease";
    labelEl.style.borderRadius = "8px";

    if (mode === "start") {
      // 🟡 Warm golden glow for beginning
      labelEl.style.boxShadow = "0 0 20px 6px rgba(255, 213, 79, 0.9)";
      labelEl.style.background = "linear-gradient(to right,#fffde7,#fff59d)";
    } 
    else if (mode === "end") {
      // 🔵 Peaceful blue glow for ending
      labelEl.style.boxShadow = "0 0 20px 6px rgba(100,181,246,0.9)";
      labelEl.style.background = "linear-gradient(to right,#e3f2fd,#bbdefb)";
    } 
    else {
      labelEl.style.boxShadow = "";
      labelEl.style.background = "";
    }
  }

  function scheduleBoosts() {
    if (!window.vocalAudio || !Array.isArray(window.segments)) return;
    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);

    console.log("🎵 Built-in Vocal Vitality Boost active...");

    window.segments.forEach((seg, i) => {
      seg._boosted = seg._fadedUp = seg._reset = false;
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        // 🚀 Boost at start
        if (cur >= seg.start && cur < seg.start + 0.3 && !seg._boosted) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost`);
          setTimeout(() => {
            setVolumeOnTargets("vocal", boosted);
            setGlow("start");
          }, BOOST_DELAY);

          // reset to base after hold
          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} reset`);
            setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // 🔄 Raise again near end
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} end raise`);
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

  console.log("🎤 Built-in Vocal Vitality Boost logic integrated (non-juggling, gold→blue theme).");
})();

*/

// =======================================================
//  🎤 Segment-Based Vocal Vitality Boost Logic (Non-Juggling)
//  🎨 Warm Gold → Peaceful Blue Glow Theme
//  ⏱️ Now strictly fires at segment boundaries
// =======================================================

(function () {
  if (window.__VOCAL_VITALITY_BUILTIN__) return;
  window.__VOCAL_VITALITY_BUILTIN__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 5000;          // hold 3s / 5s
  const END_RAISE_WINDOW = 4.0;    // seconds before end
  const CHECK_INTERVAL = 100;      // faster check rate
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
    const s = document.getElementById("vocalVolume");

    // --- Ensure vocal slider and actual audio are in sync at start ---
if (s) {
  const initialVal = parseFloat(s.value) || (DEFAULTS.vocal ?? MIN_VOL);
  setVolumeOnTargets("vocal", initialVal);
  console.log("🔄 Vocal volume initialized to", initialVal);
}



    /*
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);
    */

    /*
    // --- Determine base & boosted dynamically ---
let base = parseFloat(s?.value) || 0.0;

// If slider still at default low level (≈ 0.0027), use fixed 0.02 target for small devices.
// Otherwise, apply +25% boost relative to the user’s current chosen base.
let boosted;
if (base <= 0.003) {
  boosted = 0.02;
  console.log(`🎚️ Default mode → fixed boost to 0.02`);
} else {
  boosted = base * 1.25;
  console.log(`📱 User mode → +25% boost = ${boosted.toFixed(4)}`);
}

// Keep within valid range
boosted = Math.min(1, boosted);

*/


console.log("🎵 Built-in Vocal Vitality Boost active...");

// For each segment, use live base (reads current slider each time)
window.segments.forEach((seg, i) => {
  seg._boosted = seg._fadedUp = seg._reset = false;
  const fadeUpTime = seg.end - END_RAISE_WINDOW;

  const watcher = setInterval(() => {
    if (!a || a.paused) return;
    const cur = a.currentTime;

    // 🧮 Recalculate base and boosted each cycle
    const currentSlider = document.getElementById("vocalVolume");
    let base = parseFloat(currentSlider?.value) || 0.0;
    let boosted;

    if (base <= 0.003) {
      boosted = 0.02;
    } else {
      boosted = base * 1.25;
    }
    boosted = Math.min(1, boosted);

    // --- Safety: mark done if past segment ---
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

    // 🔄 Raise again near end
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



/*

    console.log("🎵 Built-in Vocal Vitality Boost active...");

    window.segments.forEach((seg, i) => {
      seg._boosted = seg._fadedUp = seg._reset = false;
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        // --- Safety: mark done if past segment ---
        if (cur > seg.end + 0.5) {
          seg._reset = seg._boosted = seg._fadedUp = true;
          clearInterval(watcher);
          return;
        }

        // 🚀 Boost at start (strict 0–1 s window)
        if (
          cur >= seg.start &&
          cur < seg.start + 1.0 &&
          !seg._boosted &&
          cur < seg.end - 1.0
        ) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost`);
          setTimeout(() => {
            setVolumeOnTargets("vocal", boosted);
            setGlow("start");
          }, BOOST_DELAY);

          // reset to base after hold
          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} reset`);
            setVolumeOnTargets("vocal", base);
            setGlow(null);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // 🔄 Raise again near end
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} end raise`);
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

        // 🛡️ Extra guard — if already 2 s into segment but still unboosted, mark done
        if (cur - seg.start > 2.0 && !seg._boosted) {
          seg._boosted = true;
        }
      }, CHECK_INTERVAL);
    });
  }

  */

  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.vocalAudio.addEventListener) {
        clearInterval(ensureAudio);
        window.vocalAudio.addEventListener("play", scheduleBoosts);
      }
    }, 200);
  });


  /*
    // --- Safety: ensure actual vocal & accomp audio volumes follow sliders once sources are ready ---
  window.addEventListener("load", () => {
    const vocalSlider = document.getElementById("vocalVolume");
    const accompSlider = document.getElementById("accompVolume");

    if (window.vocalAudio && vocalSlider) {
      const vVal = parseFloat(vocalSlider.value) || (DEFAULTS.vocal ?? MIN_VOL);
      setVolumeOnTargets("vocal", vVal);
      console.log("🔄 Post-load vocal volume applied:", vVal);
    }

    if (window.accompAudio && accompSlider) {
      const aVal = parseFloat(accompSlider.value) || (DEFAULTS.accomp ?? MIN_VOL);
      setVolumeOnTargets("accomp", aVal);
      console.log("🔄 Post-load accomp volume applied:", aVal);
    }
  });
  */

  /*
  // --- Final Fix: Apply initial volumes when audio metadata is ready ---
function ensureAccurateInitialVolumes() {
  const applyVolume = (type, audioEl, sliderEl) => {
    if (!audioEl || !sliderEl) return;
    const val = parseFloat(sliderEl.value) || (DEFAULTS[type] ?? MIN_VOL);
    audioEl.volume = val;
    console.log(`✅ ${type} initial volume applied after metadata:`, val);
  };

  // vocal
  if (window.vocalAudio) {
    const vocalSlider = document.getElementById("vocalVolume");
    window.vocalAudio.addEventListener("loadedmetadata", () =>
      applyVolume("vocal", window.vocalAudio, vocalSlider)
    );
  }

  // accomp
  if (window.accompAudio) {
    const accompSlider = document.getElementById("accompVolume");
    window.accompAudio.addEventListener("loadedmetadata", () =>
      applyVolume("accomp", window.accompAudio, accompSlider)
    );
  }
}

// Run after DOM ready
document.addEventListener("DOMContentLoaded", ensureAccurateInitialVolumes);
*/

/*
// --- Ultimate safeguard: enforce slider volume exactly at play time ---
function enforceSliderVolumeAtPlay() {
  const enforce = (type, audioEl, sliderId) => {
    if (!audioEl) return;
    const slider = document.getElementById(sliderId);
    audioEl.addEventListener("play", () => {
      const v = parseFloat(slider?.value) || (DEFAULTS[type] ?? MIN_VOL);
      audioEl.volume = v;
      console.log(`🎧 ${type} volume re-applied at play:`, v);
    });
  };

  enforce("vocal", window.vocalAudio, "vocalVolume");
  enforce("accomp", window.accompAudio, "accompVolume");
}

document.addEventListener("DOMContentLoaded", enforceSliderVolumeAtPlay);
*/

// --- Final foolproof volume enforcer (handles dynamic audio replacements) ---
(function () {
  function applySliderVolumesToAllAudios() {
    const vocalSlider = document.getElementById("vocalVolume");
    const accompSlider = document.getElementById("accompVolume");

    const vocalVal = parseFloat(vocalSlider?.value) || (DEFAULTS.vocal ?? MIN_VOL);
    const accompVal = parseFloat(accompSlider?.value) || (DEFAULTS.accomp ?? MIN_VOL);

    document.querySelectorAll("audio").forEach(a => {
      const role = (a.getAttribute("data-role") || "").toLowerCase();
      if (role.includes("vocal")) {
        a.volume = vocalVal;
      } else if (role.includes("accomp")) {
        a.volume = accompVal;
      }
    });

    console.log(`🎚️ Volumes enforced → vocal=${vocalVal}, accomp=${accompVal}`);
  }

  // Apply when anything changes in the DOM (new <audio> appears or is replaced)
  const observer = new MutationObserver(() => {
    applySliderVolumesToAllAudios();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also reapply right before playback
  document.body.addEventListener("play", e => {
    if (e.target.tagName === "AUDIO") applySliderVolumesToAllAudios();
  }, true);

  // Initial run
  window.addEventListener("load", applySliderVolumesToAllAudios);
})();


console.log("🎤 Built-in Vocal Vitality Boost logic — strictly start/end synced (gold→blue).");




// --- Catch any Audio() created dynamically and auto-set volume ---
(function interceptNewAudio() {
  const originalAudio = window.Audio;
  window.Audio = function (...args) {
    const a = new originalAudio(...args);
    try {
      const roleGuess = (args[0] || "").toLowerCase().includes("vocal")
        ? "vocal"
        : (args[0] || "").toLowerCase().includes("acc")
        ? "accomp"
        : null;

      if (roleGuess) {
        const slider = document.getElementById(roleGuess + "Volume");
        const val = parseFloat(slider?.value) || (DEFAULTS[roleGuess] ?? MIN_VOL);
        a.volume = val;
        console.log(`🎧 Intercepted new ${roleGuess} Audio() → volume set to`, val);
      }
    } catch (e) {}
    return a;
  };
})();

// --- Intercept .src assignment on any <audio> and reapply correct volume ---
(function interceptAudioSrcChange() {
  const proto = HTMLMediaElement.prototype;
  const origSrc = Object.getOwnPropertyDescriptor(proto, "src");
  if (!origSrc) return;

  Object.defineProperty(proto, "src", {
    get: origSrc.get,
    set: function (newSrc) {
      origSrc.set.call(this, newSrc);
      try {
        const lower = (newSrc || "").toLowerCase();
        const roleGuess = lower.includes("vocal")
          ? "vocal"
          : lower.includes("acc")
          ? "accomp"
          : null;
        if (roleGuess) {
          const slider = document.getElementById(roleGuess + "Volume");
          const val = parseFloat(slider?.value) || (DEFAULTS[roleGuess] ?? MIN_VOL);
          this.volume = val;
          console.log(`🎧 src reassigned for ${roleGuess}, volume re-applied →`, val);
        }
      } catch (e) {}
    }
  });
})();

// --- Ensure Vocal Boost logic attaches to the real vocalAudio after replacement ---
(function ensureBoostBinding() {
  const bindBoost = () => {
    if (!window.vocalAudio) return;

    // Prevent rebinding multiple times
    if (window.vocalAudio.__boostBound) return;
    window.vocalAudio.__boostBound = true;

    // Attach play listener safely
    window.vocalAudio.addEventListener("play", () => {
      try {
        if (typeof scheduleBoosts === "function") {
          scheduleBoosts();
        } else if (
          window.__VOCAL_VITALITY_BUILTIN__ &&
          typeof window.__VOCAL_VITALITY_BUILTIN__.scheduleBoosts === "function"
        ) {
          window.__VOCAL_VITALITY_BUILTIN__.scheduleBoosts();
        }
      } catch (err) {
        console.warn("⚠️ Boost listener error:", err);
      }
    });

    console.log("🎤 Boost listener attached to current vocalAudio");
  };

  // Watch for any DOM or audio changes (new vocalAudio creation)
  const observer = new MutationObserver(() => bindBoost());
  observer.observe(document.body, { childList: true, subtree: true });

  // Also check periodically (handles replacements via songLoader.js)
  const checkInterval = setInterval(bindBoost, 500);
})();
