/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — AudioControl-Compatible Edition
   --------------------------------------------------------------
   ✅ Works for all segments (1, 2, 3, ...)
   ✅ +0.02 boost → hold 3 s → reset to base
   ✅ End-of-segment raise → quick reset
   ✅ Uses same unified volume logic as audioControl.js
   ✅ No fading → No juggling
   ✅ Fully stable even at very low volumes
   ========================================================== */

(function () {
  if (window.__VOCAL_VITALITY_AUDIOCONTROL__) return;
  window.__VOCAL_VITALITY_AUDIOCONTROL__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;        // hold boost 3 s
  const END_RAISE_WINDOW = 2.0;  // 2 s before end
  const CHECK_INTERVAL = 200;    // check frequency
  const BOOST_DELAY = 120;       // slight delay for natural onset
  const MIN_VOL = 0.0024;        // from audioControl.js

  const labelEl = document.querySelector('label[for="vocalVolume"]');

  // 🌟 Visual feedback
  function setGlow(on) {
    if (!labelEl) return;
    labelEl.style.transition = "box-shadow 0.3s ease, background 0.3s ease";
    if (on) {
      labelEl.style.boxShadow = "0 0 15px 4px rgba(255,200,80,0.7)";
      labelEl.style.background = "linear-gradient(to right,#fff8e1,#ffecb3)";
      labelEl.style.borderRadius = "8px";
    } else {
      labelEl.style.boxShadow = "";
      labelEl.style.background = "";
    }
  }

  // 🎚️ Unified volume setter — exact same behavior as audioControl.js
  function setUnifiedVolume(type, val) {
    val = Math.min(1, Math.max(MIN_VOL, parseFloat(val.toFixed(2))));
    if (typeof setVolumeOnTargets === "function") {
      setVolumeOnTargets(type, val);
    } else if (window.vocalAudio) {
      window.vocalAudio.volume = val;
    }
    const s = document.getElementById(`${type}Volume`);
    const d = document.getElementById(`${type}VolumeDisplay`);
    if (s) s.value = val.toFixed(2);
    if (d) d.textContent = val.toFixed(2);
  }

  // 🧠 Core Engine
  function scheduleSegmentActions() {
    if (!window.vocalAudio || !Array.isArray(window.segments)) return;

    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);

    console.log("🎵 Vocal Vitality (AudioControl-Compatible) running...");

    window.segments.forEach((seg, i) => {
      const fadeUpTime = seg.end - END_RAISE_WINDOW;
      seg._boosted = seg._fadedUp = seg._reset = false;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        // 🚀 Segment start boost
        if (cur >= seg.start && cur < seg.start + 0.3 && !seg._boosted) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boosted +0.02`);
          setTimeout(() => {
            setUnifiedVolume("vocal", boosted);
            setGlow(true);
          }, BOOST_DELAY);

          // Reset to base after hold
          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} reset to base`);
            setUnifiedVolume("vocal", base);
            setGlow(false);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // 🔄 Raise near end
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} end raise`);
          setUnifiedVolume("vocal", boosted);
          setGlow(true);

          setTimeout(() => {
            setUnifiedVolume("vocal", base);
            setGlow(false);
          }, 500);
        }

        // ⏹️ Segment end instant reset
        if (cur >= seg.end && !seg._reset) {
          seg._reset = true;
          console.log(`⏹️ Segment ${i + 1} instant reset`);
          setUnifiedVolume("vocal", base);
          setGlow(false);
          clearInterval(watcher);
        }
      }, CHECK_INTERVAL);
    });
  }

  // 🔗 Activate when ready
  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.vocalAudio.addEventListener) {
        clearInterval(ensureAudio);
        window.vocalAudio.addEventListener("play", () => scheduleSegmentActions());
      }
    }, 200);
  });

  console.log("🎤 Vocal Vitality Boost Overlay — AudioControl-Compatible Edition installed.");
})();
