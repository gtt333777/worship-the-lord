// WorshipApp_Modular/loopPlayer.js — Mobile-gapless edition
console.log("🎵 loopPlayer.js: Starting (mobile-gapless)");

window.segments = window.segments || [];
window.currentlyPlaying = false;
window.activeSegmentTimeout = null;
window.activeSegmentInterval = null; // unused with RAF but kept for compat
window.playRunId = window.playRunId || 0;

(function () {
  // ------- config you can tweak -------
  const EPS_END_GUARD = 0.008;  // end tolerance (s)
  const JUMP_LEAD     = 0.015;  // jump this many seconds before end
  const DRIFT_SNAP    = 0.06;   // resync if drift > 60ms
  const MUTE_MS       = 20;     // hide click during jump
  // ------------------------------------

  let rafId = null;

  function isMobileChrome() {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.userAgentData && navigator.userAgentData.mobile);
    return isMobile && /Chrome|CriOS/i.test(ua);
  }

  function seekMedia(el, t) {
    try {
      if (typeof el.fastSeek === "function") { el.fastSeek(t); return; }
    } catch (e) {}
    el.currentTime = t;
  }

  function stopPlayback() {
    window.currentlyPlaying = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    try { window.vocalAudio.pause(); } catch (e) {}
    try { window.accompAudio.pause(); } catch (e) {}
  }

  function playSegment(startTime, endTime, index = 0) {
    const a = window.vocalAudio, b = window.accompAudio;
    if (!a || !b) {
      console.warn("❌ loopPlayer.js: Audio tracks not present yet.");
      return;
    }

    // cancel any previous timers/raf
    if (window.activeSegmentTimeout) { clearTimeout(window.activeSegmentTimeout); window.activeSegmentTimeout = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    const myRun = ++window.playRunId;
    console.log(`🎵 Segment: ${startTime} -> ${endTime} (${(endTime - startTime).toFixed(2)}s)`);

    // Ensure we are playing (no pause/resume cycle on mobile)
    try { a.play(); } catch (e) {}
    try { b.play(); } catch (e) {}

    // Jump to start immediately (no pre-pause, no seek-wait)
    seekMedia(a, startTime);
    seekMedia(b, startTime);
    window.currentlyPlaying = true;

    // State for chained segments
    let curIndex = index;
    let curEnd   = endTime;

    const tick = () => {
      if (myRun !== window.playRunId) return; // superseded

      // Micro-resync if tracks drift too far
      const drift = Math.abs(a.currentTime - b.currentTime);
      if (drift > DRIFT_SNAP) {
        if (a.currentTime > b.currentTime) seekMedia(b, a.currentTime);
        else seekMedia(a, b.currentTime);
      }

      const t = Math.max(a.currentTime, b.currentTime);

      // Time to jump to next?
      if (t >= (curEnd - Math.max(JUMP_LEAD, EPS_END_GUARD))) {
        const next = curIndex + 1;
        if (next >= window.segments.length) {
          stopPlayback();
          return;
        }

        const ns = window.segments[next];
        // Brief mute to hide click artifacts on some devices
        const va = a.volume, vb = b.volume;
        a.volume = 0; b.volume = 0;
        seekMedia(a, ns.start);
        seekMedia(b, ns.start);
        setTimeout(() => { a.volume = va; b.volume = vb; }, MUTE_MS);

        // Advance state and keep the same RAF loop running (no pause/play)
        curIndex = next;
        curEnd   = ns.end;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  }

  // Expose for other scripts
  window.playSegment = playSegment;

  // ===== UI wiring (unchanged from your version) =====
  window.currentPlayingSegmentIndex = null;

  document.addEventListener("DOMContentLoaded", () => {
    const loopButtonsDiv = document.getElementById("loopButtonsContainer");
    if (!loopButtonsDiv) { console.warn("loopPlayer.js: #loopButtonsContainer not found"); return; }

    const songNameDropdown = document.getElementById("songSelect");
    if (!songNameDropdown) { console.warn("loopPlayer.js: #songSelect not found"); return; }

    songNameDropdown.addEventListener("change", () => {
      const selectedTamilName = songNameDropdown.value;
      console.log("🎵 loopPlayer.js: Song selected ->", selectedTamilName);
      const loopFile = `lyrics/${selectedTamilName}_loops.json`;

      console.log("📁 Trying to fetch loop file:", loopFile);
      fetch(loopFile)
        .then((r) => { if (!r.ok) throw new Error(`Loop file not found: ${loopFile}`); return r.json(); })
        .then((loopData) => {
          console.log("✅ Loop data loaded:", loopData);
          window.segments = loopData;

          loopButtonsDiv.innerHTML = "";
          loopData.forEach((segment, index) => {
            const btn = document.createElement("button");
            btn.className = "segment-button";
            btn.textContent = `Segment ${index + 1}`;
            btn.addEventListener("click", () => {
              const ready = window.vocalAudio?.readyState >= 2 && window.accompAudio?.readyState >= 2;
              if (!ready) {
                console.warn("⏳ Audio not ready yet, using segment-ready helper...");
                checkReadyAndPlaySegment(segment.start, segment.end, index);
              } else {
                // one call is enough; play() isn’t re-issued on every boundary
                playSegment(segment.start, segment.end, index);
              }
            });
            loopButtonsDiv.appendChild(btn);
          });

          if (typeof window.startSegmentProgressVisualizer === "function") {
            const loopButtonsContainer = document.getElementById("loopButtonsContainer");
            window.startSegmentProgressVisualizer(window.segments, window.vocalAudio, loopButtonsContainer);
          }

          if (window.wantAutoSegment1 && window.segments.length > 0) {
            const startSeg1 = () => {
              const seg = window.segments[0];
              console.log("🎯 Auto-starting Segment 1 (from loopPlayer.js)");
              playSegment(seg.start, seg.end, 0);
              window.wantAutoSegment1 = false;
            };
            if (window.audioReadyPromise && typeof window.audioReadyPromise.then === "function") {
              window.audioReadyPromise.then(startSeg1);
            } else {
              startSeg1();
            }
          }
        })
        .catch((err) => console.warn("❌ loopPlayer.js: Error loading loop file:", err));
    });
  });

  // Segment-specific readiness helper (unchanged)
  window.checkReadyAndPlaySegment = function checkReadyAndPlaySegment(startTime, endTime, index = 0) {
    const ready = window.vocalAudio?.readyState >= 2 && window.accompAudio?.readyState >= 2;
    if (!ready) {
      console.warn("⏳ loopPlayer.js: Audio not ready yet for segment, waiting on audioReadyPromise...");
      if (window.audioReadyPromise && typeof window.audioReadyPromise.then === "function") {
        window.audioReadyPromise.then(() => { window.playSegment(startTime, endTime, index); });
      } else {
        setTimeout(() => checkReadyAndPlaySegment(startTime, endTime, index), 200);
      }
      return;
    }
    console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
    window.playSegment(startTime, endTime, index);
  };
})();
