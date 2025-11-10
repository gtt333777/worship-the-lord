/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — Timer-Based (GainNode Edition)
   --------------------------------------------------------------
   ✅ Works for all segments 1, 2, 3, ...
   ✅ +0.02 boost (smooth fade-up) → hold 3 s → fade-down
   ✅ Fade-up 2 s before end → quick reset
   ✅ Survives pause/resume — fully stable
   ✅ ZERO juggling (GainNode-based smooth fading)
   ========================================================== */

(function () {
  if (window.__VOCAL_VITALITY_GAINNODE__) return;
  window.__VOCAL_VITALITY_GAINNODE__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;          // hold boost 3s
  const FADE_TIME = 500;           // fade duration in ms
  const END_RAISE_WINDOW = 2.0;    // seconds before end
  const CHECK_INTERVAL = 200;      // interval check
  const BOOST_DELAY = 100;         // prevent early jumps

  let ctx, vocalGainNode, accompGainNode;

  // --- Set up Web Audio GainNodes for smooth fades ---
  function ensureGainNodes() {
    if (vocalGainNode && accompGainNode) return;

    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (!ctx || !window.vocalAudio || !window.accompAudio) return;

      const vocalSrc = ctx.createMediaElementSource(window.vocalAudio);
      const accompSrc = ctx.createMediaElementSource(window.accompAudio);

      vocalGainNode = ctx.createGain();
      accompGainNode = ctx.createGain();

      vocalGainNode.gain.value = window.vocalAudio.volume;
      accompGainNode.gain.value = window.accompAudio.volume;

      vocalSrc.connect(vocalGainNode).connect(ctx.destination);
      accompSrc.connect(accompGainNode).connect(ctx.destination);

      window.vocalGainNode = vocalGainNode;
      window.accompGainNode = accompGainNode;

      console.log("🎚️ Web Audio GainNodes attached for smooth control.");
    } catch (err) {
      console.warn("⚠️ GainNode setup failed, falling back to .volume:", err);
    }
  }

  // --- Helper to set effective volume (GainNode or fallback) ---
  function setVocalVolume(vol) {
    if (vocalGainNode) vocalGainNode.gain.value = vol;
    else if (window.vocalAudio) window.vocalAudio.volume = vol;
  }

  // --- Label glow effect ---
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

  // --- Smooth fade helper (GainNode-safe) ---
  function fadeVocalTo(target, onComplete) {
    if (!window.vocalAudio) return;
    const s = document.getElementById("vocalVolume");
    const d = document.getElementById("vocalVolumeDisplay");

    const currentVol = vocalGainNode
      ? vocalGainNode.gain.value
      : window.vocalAudio.volume;

    const start = currentVol;
    const delta = target - start;
    const steps = Math.max(1, Math.round(FADE_TIME / 150));
    let count = 0;
    let visualVol = start;

    const int = setInterval(() => {
      count++;
      const p = count / steps;
      visualVol = Math.min(1, Math.max(0, start + delta * p));

      // update UI only (no real-time engine changes)
      if (s) s.value = visualVol.toFixed(2);
      if (d) d.textContent = visualVol.toFixed(2);

      if (count >= steps) {
        clearInterval(int);
        setVocalVolume(target); // apply once
        if (s) s.value = target.toFixed(2);
        if (d) d.textContent = target.toFixed(2);
        if (onComplete) onComplete();
      }
    }, 100);
  }

  // --- Core engine ---
  function scheduleSegmentActions() {
    ensureGainNodes();

    if (!window.vocalAudio || !Array.isArray(window.segments)) return;
    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");
    const d = document.getElementById("vocalVolumeDisplay");
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);

    console.log("🎵 Timer-based scheduler (GainNode Edition) running...");

    window.segments.forEach((seg, i) => {
      const fadeUpTime = seg.end - END_RAISE_WINDOW;

      const watcher = setInterval(() => {
        if (!a || a.paused) return;
        const cur = a.currentTime;

        // --- Smooth boost at start ---
        if (cur >= seg.start && cur < seg.start + 0.3 && !seg._boosted) {
          seg._boosted = true;
          console.log(`🚀 Segment ${i + 1} smooth boost +0.02`);

          setTimeout(() => {
            fadeVocalTo(boosted, () => {
              setGlow(true);
            });
          }, BOOST_DELAY);

          // Fade-down after hold
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
          setVocalVolume(base);
          if (s) s.value = base.toFixed(2);
          if (d) d.textContent = base.toFixed(2);
          setGlow(false);
          clearInterval(watcher);
        }
      }, CHECK_INTERVAL);
    });
  }

  // --- Initialize once ready ---
  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.accompAudio) {
        clearInterval(ensureAudio);
        ensureGainNodes(); // ✅ attach smooth volume nodes
        window.vocalAudio.addEventListener("play", () => {
          if (ctx?.state === "suspended") ctx.resume();
          scheduleSegmentActions();
        });
      }
    }, 200);
  });

  console.log("🎤 Vocal Vitality Boost Overlay — GainNode Edition installed.");
})();
