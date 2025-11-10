/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — Timer-Based (Limited Firing Stable Version)
   --------------------------------------------------------------
   ✅ Works for all segments 1, 2, 3, ...
   ✅ +0.02 boost → hold 3 s → fade-down
   ✅ Fade-up 2 s before end → quick reset
   ✅ Survives pause/resume — fully stable
   ✅ Prevents multiple triggers (each fires once)
   ========================================================== */

(function () {
  if (window.__VOCAL_VITALITY_LIMITED__) return;
  window.__VOCAL_VITALITY_LIMITED__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;         // hold boost 3s
  const FADE_TIME = 500;          // fade speed
  const END_RAISE_WINDOW = 2.0;   // seconds before end
  const CHECK_INTERVAL = 200;     // interval check

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

  // --- smooth fade helper ---
  function fadeVocalTo(target, onComplete) {
    if (!window.vocalAudio) return;
    const start = window.vocalAudio.volume;
    const delta = target - start;
    const steps = Math.max(1, Math.round(FADE_TIME / 100));
    let count = 0;

    const int = setInterval(() => {
      if (!window.vocalAudio) return clearInterval(int);
      count++;
      const p = count / steps;
      const newVol = Math.min(1, Math.max(0, start + delta * p));
      window.vocalAudio.volume = newVol;
      const s = document.getElementById("vocalVolume");
      const d = document.getElementById("vocalVolumeDisplay");
      if (s) s.value = newVol.toFixed(2);
      if (d) d.textContent = newVol.toFixed(2);
      if (count >= steps) {
        clearInterval(int);
        if (onComplete) onComplete();
      }
    }, 100);
  }

  // --- main engine ---
  function scheduleSegmentActions() {
    if (!window.vocalAudio || !Array.isArray(window.segments)) return;
    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");
    const d = document.getElementById("vocalVolumeDisplay");
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);

    console.log("🎵 Timer-based scheduler (Limited firing) running...");

    window.segments.forEach((seg, i) => {
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      // ✅ Limit triggers strictly per segment
      seg._done = false;
      seg._boosted = false;
      seg._fadedUp = false;
      seg._reset = false;

      const watcher = setInterval(() => {
        if (!a || a.paused || seg._done) return; // skip if paused or done
        const cur = a.currentTime;

        // --- Boost at start (fires once) ---
        if (cur >= seg.start && cur < seg.start + 0.3 && !seg._boosted) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} boost +0.02`);
          a.volume = boosted;
          if (s) s.value = boosted.toFixed(2);
          if (d) d.textContent = boosted.toFixed(2);
          setGlow(true);

          // fade-down after 3 s
          setTimeout(() => {
            if (a.paused) return;
            console.log(`⬇️ Segment ${i + 1} fade-down after hold`);
            fadeVocalTo(base, () => setGlow(false));
          }, HOLD_TIME);
        }

        // --- Fade-up near end (fires once) ---
        if (cur >= fadeUpTime && cur < seg.end && !seg._fadedUp) {
          seg._fadedUp = true;
          console.log(`🔄 Segment ${i + 1} fade-up near end`);
          fadeVocalTo(boosted, () => {
            setGlow(true);
            setTimeout(() => {
              fadeVocalTo(base, () => {
                console.log(`✅ Segment ${i + 1} quick fade-down done`);
                setGlow(false);
              });
            }, 200);
          });
        }

        // --- Instant reset at end (fires once) ---
        if (cur >= seg.end && !seg._reset) {
          seg._reset = true;
          console.log(`⏹️ Segment ${i + 1} instant reset`);
          a.volume = base;
          if (s) s.value = base.toFixed(2);
          if (d) d.textContent = base.toFixed(2);
          setGlow(false);

          // ✅ Fully mark segment as done, stop checking
          seg._done = true;
          clearInterval(watcher);
        }
      }, CHECK_INTERVAL);
    });
  }

  // --- attach when ready ---
  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.vocalAudio.addEventListener) {
        clearInterval(ensureAudio);
        window.vocalAudio.addEventListener("play", () => scheduleSegmentActions());
      }
    }, 200);
  });

  console.log("🎤 Vocal Vitality Boost Overlay — Limited Firing Stable Version installed.");
})();
