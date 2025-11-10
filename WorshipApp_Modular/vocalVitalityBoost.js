/* ==========================================================
   🎤 Vocal Vitality Boost Overlay — Timer-Based (Single-Trigger GainNode Edition)
   --------------------------------------------------------------
   ✅ Works for all segments 1, 2, 3, ...
   ✅ Each segment fires boost logic only ONCE
   ✅ +0.02 boost (smooth fade-up) → hold 3 s → fade-down
   ✅ Fade-up 2 s before end → quick reset
   ✅ ZERO juggling, ZERO overlap
   ========================================================== */

(function () {
  if (window.__VOCAL_VITALITY_FINAL__) return;
  window.__VOCAL_VITALITY_FINAL__ = true;

  const BOOST_AMOUNT = 0.02;
  const HOLD_TIME = 3000;
  const FADE_TIME = 500;
  const END_RAISE_WINDOW = 2.0;
  const BOOST_DELAY = 100;

  let ctx, vocalGainNode, accompGainNode;

  // --- Smooth GainNode Setup ---
  function ensureGainNodes() {
    if (vocalGainNode && accompGainNode) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const vocalSrc = ctx.createMediaElementSource(window.vocalAudio);
      const accompSrc = ctx.createMediaElementSource(window.accompAudio);

      vocalGainNode = ctx.createGain();
      accompGainNode = ctx.createGain();
      vocalGainNode.gain.value = window.vocalAudio.volume;
      accompGainNode.gain.value = window.accompAudio.volume;

      vocalSrc.connect(vocalGainNode).connect(ctx.destination);
      accompSrc.connect(accompGainNode).connect(ctx.destination);

      window.vocalGainNode = vocalGainNode;
      console.log("🎚️ GainNodes attached (single-trigger edition).");
    } catch (err) {
      console.warn("⚠️ GainNode unavailable, fallback to .volume");
    }
  }

  function setVocalVolume(vol) {
    if (vocalGainNode) vocalGainNode.gain.value = vol;
    else window.vocalAudio.volume = vol;
  }

  // --- Glow Helper ---
  const labelEl = document.querySelector('label[for="vocalVolume"]');
  function setGlow(on) {
    if (!labelEl) return;
    labelEl.style.transition = "box-shadow 0.3s ease, background 0.3s ease";
    labelEl.style.boxShadow = on ? "0 0 15px 4px rgba(255,200,80,0.7)" : "";
    labelEl.style.background = on ? "linear-gradient(to right,#fff8e1,#ffecb3)" : "";
  }

  // --- Fade Helper ---
  function fadeVocalTo(target, onComplete) {
    if (!window.vocalAudio) return;
    const s = document.getElementById("vocalVolume");
    const d = document.getElementById("vocalVolumeDisplay");
    const start = vocalGainNode ? vocalGainNode.gain.value : window.vocalAudio.volume;
    const delta = target - start;
    const steps = Math.max(1, Math.round(FADE_TIME / 100));
    let count = 0;

    const int = setInterval(() => {
      count++;
      const p = count / steps;
      const newVol = Math.min(1, Math.max(0, start + delta * p));
      if (s) s.value = newVol.toFixed(2);
      if (d) d.textContent = newVol.toFixed(2);
      if (count >= steps) {
        clearInterval(int);
        setVocalVolume(target);
        if (onComplete) onComplete();
      }
    }, 100);
  }

  // --- Scheduler (fires only once per segment) ---
  function scheduleSegmentActions() {
    ensureGainNodes();
    const a = window.vocalAudio;
    const s = document.getElementById("vocalVolume");
    const base = parseFloat(s?.value) || 0.0;
    const boosted = Math.min(1, base + BOOST_AMOUNT);

    if (!a || !window.segments) return;
    console.log("🎵 Single-trigger scheduler running...");

    window.segments.forEach((seg, i) => {
      const startDelay = seg.start * 1000; // ms
      const endFadeTime = (seg.end - END_RAISE_WINDOW) * 1000;

      // --- 1️⃣ Boost trigger ---
      setTimeout(() => {
        if (a.paused) return;
        console.log(`🚀 Segment ${i + 1} boost`);
        setTimeout(() => fadeVocalTo(boosted, () => setGlow(true)), BOOST_DELAY);
        setTimeout(() => fadeVocalTo(base, () => setGlow(false)), HOLD_TIME);
      }, startDelay);

      // --- 2️⃣ Fade-up near end trigger ---
      setTimeout(() => {
        if (a.paused) return;
        console.log(`🔄 Segment ${i + 1} fade-up near end`);
        fadeVocalTo(boosted, () => {
          setGlow(true);
          setTimeout(() => {
            fadeVocalTo(base, () => {
              setGlow(false);
              console.log(`✅ Segment ${i + 1} fade cycle complete`);
            });
          }, 200);
        });
      }, endFadeTime);
    });
  }

  // --- Activation ---
  document.addEventListener("DOMContentLoaded", () => {
    const ensureAudio = setInterval(() => {
      if (window.vocalAudio && window.accompAudio && Array.isArray(window.segments)) {
        clearInterval(ensureAudio);
        ensureGainNodes();
        window.vocalAudio.addEventListener("play", () => {
          if (ctx?.state === "suspended") ctx.resume();
          scheduleSegmentActions();
        });
      }
    }, 200);
  });

  console.log("🎤 Vocal Vitality Boost Overlay — Single-Trigger GainNode Edition installed.");
})();
