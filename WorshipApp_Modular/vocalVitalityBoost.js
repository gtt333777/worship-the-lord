



/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — Single-Segment Proper Reset
   --------------------------------------------------------------
   ✅ First segment only
   ✅ +0.02 boost → hold 3 s → fade-down
   ✅ Fade-up 2 s before end → quick reset to base
   ========================================================== */
   /*
(function () {
  if (window.__VOCAL_VITALITY_SEGMENT1__) return;
  window.__VOCAL_VITALITY_SEGMENT1__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;
  const FADE_TIME = 500;
  const CHECK_INTERVAL = 100;
  const END_RAISE_WINDOW = 2.0;

  let baseVocal = null;
  let boostTimer = null;
  let endWatcher = null;
  let fading = false;

  // --- glow helper ---
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

  // --- smooth fade ---
  function fadeVocalTo(target, onComplete) {
    if (!window.vocalAudio) return;
    const start = window.vocalAudio.volume;
    const delta = target - start;
    const steps = Math.max(1, Math.round(FADE_TIME / CHECK_INTERVAL));
    let count = 0;
    fading = true;
    clearInterval(window.__vocalFadeInt);
    window.__vocalFadeInt = setInterval(() => {
      if (!window.vocalAudio) return;
      count++;
      const p = count / steps;
      const newVol = Math.min(1, Math.max(0, start + delta * p));
      window.vocalAudio.volume = newVol;
      const s = document.getElementById("vocalVolume");
      const d = document.getElementById("vocalVolumeDisplay");
      if (s) s.value = newVol.toFixed(2);
      if (d) d.textContent = newVol.toFixed(2);
      if (count >= steps) {
        clearInterval(window.__vocalFadeInt);
        fading = false;
        if (onComplete) onComplete();
      }
    }, CHECK_INTERVAL);
  }

  // --- start boost ---
  function applyStartBoost() {
    if (!window.vocalAudio) return;
    const s = document.getElementById("vocalVolume");
    const d = document.getElementById("vocalVolumeDisplay");
    baseVocal = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, baseVocal + BOOST_AMOUNT);

    window.vocalAudio.volume = boosted;
    if (s) s.value = boosted.toFixed(2);
    if (d) d.textContent = boosted.toFixed(2);
    setGlow(true);

    clearTimeout(boostTimer);
    boostTimer = setTimeout(() => {
      fadeVocalTo(baseVocal, () => setGlow(false));
    }, HOLD_TIME);
  }

  // --- fade-up near end, then reset cleanly ---
  function installEndWatcher() {
    clearInterval(endWatcher);
    if (!window.vocalAudio || !Array.isArray(window.segments)) return;
    endWatcher = setInterval(() => {
      const a = window.vocalAudio;
      const segs = window.segments;
      if (!a || !window.currentlyPlaying || segs.length === 0) return;

      const seg = segs[0];
      if (!seg) return;

      const curTime = a.currentTime;
      if (curTime < seg.start || curTime >= seg.end) return;

      const timeToEnd = seg.end - curTime;
      if (timeToEnd > 0 && timeToEnd <= END_RAISE_WINDOW && !fading) {
        fading = true;
        fadeVocalTo(Math.min(1, baseVocal + BOOST_AMOUNT), () => {
          console.log("🔄 Segment1 fade-up done → quick reset to base");
          // short delay then fade back to base quietly
          setTimeout(() => {
            fadeVocalTo(baseVocal, () => {
              const s = document.getElementById("vocalVolume");
              const d = document.getElementById("vocalVolumeDisplay");
              if (s) s.value = baseVocal.toFixed(2);
              if (d) d.textContent = baseVocal.toFixed(2);
              setGlow(false);
              fading = false;
              clearTimeout(boostTimer);
              boostTimer = null;
            });
          }, 200);
        });
        setGlow(true);
      }
    }, 200);
  }

  // --- activate on Play ---
  document.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("playBtn");
    if (!playBtn) return;
    playBtn.addEventListener("click", () => {
      if (window.vocalAudio && window.accompAudio) {
        applyStartBoost();
        installEndWatcher();
      }
    });
  });

  // --- cleanup ---
  function stopWatchers() {
    clearTimeout(boostTimer);
    clearInterval(endWatcher);
    clearInterval(window.__vocalFadeInt);
    fading = false;
    setGlow(false);
  }

  window.vocalAudio?.addEventListener("pause", stopWatchers);
  window.vocalAudio?.addEventListener("ended", stopWatchers);
  window.addEventListener("pagehide", stopWatchers);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopWatchers();
  });

  console.log("🎤 Vocal Vitality Boost Overlay (single-segment proper reset) installed.");
})();


*/









/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — Timer-Based (Stable Playback Version)
   --------------------------------------------------------------
   ✅ Works for all segments 1, 2, 3, ...
   ✅ +0.02 boost → hold 3 s → fade-down
   ✅ Fade-up 2 s before end → quick reset
   ✅ Survives pause/resume — fully stable
   ========================================================== */

(function () {
  if (window.__VOCAL_VITALITY_TIMER_STABLE__) return;
  window.__VOCAL_VITALITY_TIMER_STABLE__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;          // hold boost 3s
  const FADE_TIME = 500;           // fade speed
  const END_RAISE_WINDOW = 2.0;    // seconds before end
  const CHECK_INTERVAL = 200;      // interval check

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

    console.log("🎵 Timer-based scheduler running...");

    window.segments.forEach((seg, i) => {
      const duration = seg.end - seg.start;

      // Calculate times relative to actual audio
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      // Create internal interval watcher that adapts to pause/resume
      const watcher = setInterval(() => {
        if (!a || a.paused) return; // only act while playing
        const cur = a.currentTime;

        // --- Boost at start ---
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

        // --- Fade-up near end ---
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

        // --- Instant reset at end ---
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


  /*

  // --- activate once actual playback starts ---
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.vocalAudio) return;
    window.vocalAudio.addEventListener("play", () => {
      scheduleSegmentActions();
    });
  });
  */

  document.addEventListener("DOMContentLoaded", () => {
  const ensureAudio = setInterval(() => {
    if (window.vocalAudio && window.vocalAudio.addEventListener) {
      clearInterval(ensureAudio);
      window.vocalAudio.addEventListener("play", () => scheduleSegmentActions());
    }
  }, 200);
});




  console.log("🎤 Vocal Vitality Boost Overlay — Timer-Based (Stable Playback) installed.");
})();
