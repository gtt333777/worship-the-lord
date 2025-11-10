/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — Timer-Based (Single-Step Stable Version)
   --------------------------------------------------------------
   ✅ Works for all segments 1, 2, 3, ...
   ✅ +0.02 boost (single-step) → hold 3 s → instant reset
   ✅ Fade-up near end → instant reset
   ✅ Survives pause/resume — stable
   ✅ No fade animation → zero juggling
   ========================================================== */

(function () {
  if (window.__VOCAL_VITALITY_SINGLESTEP__) return;
  window.__VOCAL_VITALITY_SINGLESTEP__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;          // hold boost 3s
  const END_RAISE_WINDOW = 2.0;    // seconds before end
  const CHECK_INTERVAL = 200;      // interval check
  const BOOST_DELAY = 120;         // small delay prevents instant pop

  const labelEl = document.querySelector('label[for="vocalVolume"]');

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

  // --- Main Engine ---
  function scheduleSegmentActions() {
    if (!window.vocalAudio || !Array.isArray(window.segments)) return;

    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");
    const d = document.getElementById("vocalVolumeDisplay");
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);

    console.log("🎵 Vocal Vitality (Single-Step) scheduler running...");

    window.segments.forEach((seg, i) => {
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      seg._boosted = false;
      seg._fadedUp = false;
      seg._reset = false;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        // --- Boost at start (single-step, one time) ---
        if (cur >= seg.start && cur < seg.start + 0.3 && !seg._boosted) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost +0.02`);

          setTimeout(() => {
            a.volume = boosted;
            if (s) s.value = boosted.toFixed(2);
            if (d) d.textContent = boosted.toFixed(2);
            setGlow(true);
          }, BOOST_DELAY);

          // Reset to base after hold
          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} reset to base after hold`);
            a.volume = base;
            if (s) s.value = base.toFixed(2);
            if (d) d.textContent = base.toFixed(2);
            setGlow(false);
          }, HOLD_TIME + BOOST_DELAY);
        }

        // --- Simple raise near end (no fade) ---
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} end raise`);
          a.volume = boosted;
          if (s) s.value = boosted.toFixed(2);
          if (d) d.textContent = boosted.toFixed(2);
          setGlow(true);

          // Reset immediately at end
          setTimeout(() => {
            a.volume = base;
            if (s) s.value = base.toFixed(2);
            if (d) d.textContent = base.toFixed(2);
            setGlow(false);
          }, 500);
        }

        // --- Instant reset at segment end ---
        if (cur >= seg.end && !seg._reset) {
          seg._reset = true;
          console.log(`⏹️ Segment ${i + 1} instant reset`);
          a.volume = base;
          if (s) s.value = base.toFixed(2);
          if (d) d.textContent = base.toFixed(2);
          setGlow(false);
          clearInterval(watcher);
        }
      }, CHECK_INTERVAL);
    });
  }

  // --- Attach when audio ready ---
  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.vocalAudio.addEventListener) {
        clearInterval(ensureAudio);
        window.vocalAudio.addEventListener("play", () => scheduleSegmentActions());
      }
    }, 200);
  });

  console.log("🎤 Vocal Vitality Boost Overlay — Single-Step Stable Version installed.");
})();
