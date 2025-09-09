// WorshipApp_Modular/loopPlayer.js
console.log("🎵 loopPlayer.js: Starting...");

window.segments = [];
window.currentlyPlaying = false;
window.activeSegmentTimeout = null;   // kept for compatibility (cleared on play)
window.activeSegmentInterval = null;  // watchdog interval (new)
window.playRunId = 0;                 // cancels older overlapping plays (new)

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not present yet, will start after ready...");
    return;
  }

  // Cancel any previous timers/intervals from older plays
  if (window.activeSegmentTimeout) {
    clearTimeout(window.activeSegmentTimeout);
    window.activeSegmentTimeout = null;
  }
  if (window.activeSegmentInterval) {
    clearInterval(window.activeSegmentInterval);
    window.activeSegmentInterval = null;
  }

  // Bump run id to invalidate older plays that might still resolve
  const myRun = ++window.playRunId;

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  // Pause and seek both players to start (seek must finish before play)
  
  window.vocalAudio.pause();
  window.accompAudio.pause();
  
  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  // Wait until both have actually finished seeking before playing
  const once = (el, ev) => new Promise(res => (el.readyState >= 2 ? res() : el.addEventListener(ev, () => res(), { once: true })));
  const seekedVocal = once(window.vocalAudio, "seeked");
  const seekedAcc   = once(window.accompAudio, "seeked");


    
  Promise.all([seekedVocal, seekedAcc]).then(() => {
    if (myRun !== window.playRunId) return; // aborted by a newer play
    return Promise.all([window.vocalAudio.play(), window.accompAudio.play()]);
  }).then(() => {
    if (myRun !== window.playRunId) return; // aborted by a newer play

    window.currentlyPlaying = true;
        
    // Watchdog based on actual time; also micro-resync the two tracks
    const EPS   = 0.02; // 20ms guard near the end
    const DRIFT = 0.06; // resync if drift > 60ms

    window.activeSegmentInterval = setInterval(() => {
      // If another play took over, stop this watchdog
      if (myRun !== window.playRunId) {
        clearInterval(window.activeSegmentInterval);
        window.activeSegmentInterval = null;
        return;

      }
         
      // Micro-resync: keep accompaniment locked to vocal
      const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
      if (diff > DRIFT) {
        window.accompAudio.currentTime = window.vocalAudio.currentTime;
      }

      // End of segment?
      if (window.vocalAudio.currentTime >= endTime - EPS) {
        clearInterval(window.activeSegmentInterval);
        window.activeSegmentInterval = null;

        window.vocalAudio.pause();
        window.accompAudio.pause();
        window.currentlyPlaying = false;

        // Auto-advance from here (no setTimeout drift)
        if (index < window.segments.length - 1) {
          const next = window.segments[index + 1];
          playSegment(next.start, next.end, index + 1);
        }
      }
    }, 50); // ~20 checks per second
  }).catch(err => {
    console.warn("⚠️ loopPlayer.js: playSegment error:", err);
  });
}

window.currentPlayingSegmentIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");
  if (!loopButtonsDiv) {
    console.warn("loopPlayer.js: #loopButtonsContainer not found");
    return;
  }

  const songNameDropdown = document.getElementById("songSelect");
  if (!songNameDropdown) {
    console.warn("loopPlayer.js: #songSelect not found");
    return;
  }

  songNameDropdown.addEventListener("change", () => {
    const selectedTamilName = songNameDropdown.value;
    console.log("🎵 loopPlayer.js: Song selected ->", selectedTamilName);
    const loopFile = `lyrics/${selectedTamilName}_loops.json`;

    console.log("📁 Trying to fetch loop file:", loopFile);

    fetch(loopFile)
      .then((response) => {
        if (!response.ok) throw new Error(`Loop file not found: ${loopFile}`);
        return response.json();
      })
      .then((loopData) => {
        console.log("✅ Loop data loaded:", loopData);
        window.segments = loopData;

        // Clear existing buttons
        loopButtonsDiv.innerHTML = "";

        // Create segment buttons
        loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;

          btn.addEventListener("click", () => {
            const isReady = window.vocalAudio?.readyState >= 2 && window.accompAudio?.readyState >= 2;
            if (!isReady) {
              console.warn("⏳ Audio not ready yet, using segment-ready helper...");
              checkReadyAndPlaySegment(segment.start, segment.end, index);
            } else {
              playSegment(segment.start, segment.end, index);

              
              setTimeout(() => playSegment(segment.start, segment.end, index), 70);
              setTimeout(() => playSegment(segment.start, segment.end, index), 140);
              setTimeout(() => playSegment(segment.start, segment.end, index), 210);

              

            }
          });

          loopButtonsDiv.appendChild(btn);
        });

        // ✅ Notify segmentProgressVisualizer.js
        if (typeof window.startSegmentProgressVisualizer === "function") {
          const loopButtonsContainer = document.getElementById("loopButtonsContainer");
          window.startSegmentProgressVisualizer(window.segments, window.vocalAudio, loopButtonsContainer);
        }

        // 🔁 Handshake: if user already pressed Play and wants Segment 1 auto-start
        if (window.wantAutoSegment1 && window.segments.length > 0) {
          const startSeg1 = () => {
            const seg = window.segments[0];
            console.log("🎯 Auto-starting Segment 1 (from loopPlayer.js)");
            playSegment(seg.start, seg.end, 0);
            window.wantAutoSegment1 = false; // do this only once
          };

          if (window.audioReadyPromise && typeof window.audioReadyPromise.then === "function") {
            window.audioReadyPromise.then(startSeg1);
          } else {
            // If audio is already ready (rare), just go now
            startSeg1();
          }
        }
      })
      .catch((error) => {
        console.warn("❌ loopPlayer.js: Error loading loop file:", error);
      });
  });
});

/**
 * ✅ Segment-specific readiness helper to avoid clashing with songLoader.js
 * This name intentionally differs from songLoader.js's checkReadyAndPlay().
 */
function checkReadyAndPlaySegment(startTime, endTime, index = 0) {
  const isReady = window.vocalAudio?.readyState >= 2 && window.accompAudio?.readyState >= 2;

  if (!isReady) {
    console.warn("⏳ loopPlayer.js: Audio not ready yet for segment, waiting on audioReadyPromise...");
    if (window.audioReadyPromise && typeof window.audioReadyPromise.then === "function") {
      window.audioReadyPromise.then(() => {
        playSegment(startTime, endTime, index);
      });
    } else {
      // Fallback: small delay and try again
      setTimeout(() => checkReadyAndPlaySegment(startTime, endTime, index), 200);
    }
    return;
  }

  console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
  playSegment(startTime, endTime, index);
}






/* ==========================================================
   ✅ Seamless inter-segment handoff (mobile-safe)
   - Paste at END of loopPlayer.js (no modules/imports)
   - Leaves your first segment start untouched
   - Removes ~1s gap on phones by jumping in-place at boundaries
   - Stops at the last segment (no postlude)
   ========================================================== *
(function () {
  if (window.__SEAMLESS_CHAIN_PATCH__) return;
  window.__SEAMLESS_CHAIN_PATCH__ = true;

  // Keep a reference to your current playSegment so we can re-use its start behavior
  var __origPlaySegment = window.playSegment;

  // Replace playSegment with a version that:
  //  - Starts the requested segment using your current logic
  //  - Then, for chain advance, uses an in-place jump (no pause, no re-call)
  window.playSegment = function (startTime, endTime, index) {
    if (typeof __origPlaySegment !== "function") return;

    // Start as you already do today (this preserves your perfect first start)
    __origPlaySegment.call(this, startTime, endTime, index);

    // After the original sets up and begins playback, install our seamless handoff loop
    const myRun = window.playRunId; // capture the run that __origPlaySegment just started
    const a = window.vocalAudio, b = window.accompAudio;
    if (!a || !b) return;

    // Small, safe constants (tunable if needed)
    const EPS_END   = 0.02; // 20 ms guard right at a boundary
    const DRIFT_FIX = 0.06; // if accomp lags >60 ms, snap to vocal
    const CHECK_EVERY_MS = 40; // checker frequency (~25/s)

    // Manage current segment bounds locally; we mutate them when we jump
    let curIdx  = index|0;
    let curEnd  = endTime;
    let jumped  = false; // to avoid double-actions in one tick

    // Kill any previous handoff loop for older runs
    if (window.__seamlessInterval) {
      clearInterval(window.__seamlessInterval);
      window.__seamlessInterval = null;
    }

    window.__seamlessInterval = setInterval(function () {
      // If another start took over, stop this loop
      if (myRun !== window.playRunId) {
        clearInterval(window.__seamlessInterval);
        window.__seamlessInterval = null;
        return;
      }

      // Safety: if players vanished, stop
      if (!window.vocalAudio || !window.accompAudio) {
        clearInterval(window.__seamlessInterval);
        window.__seamlessInterval = null;
        return;
      }

      // Micro-resync (vocal = master): if accomp lags a lot, pull it forward
      const va = a.currentTime;
      const vb = b.currentTime;
      const lag = va - vb;
      if (lag > DRIFT_FIX) {
        try {
          if (typeof b.fastSeek === "function") b.fastSeek(va);
          else b.currentTime = va;
        } catch(_) { b.currentTime = va; }
      }

      // End-of-segment handling
      // We only change behavior HERE: no pause + no recursive playSegment call.
      // Instead, jump in-place to the next segment's start while staying "playing".
      if (va >= curEnd - EPS_END) {
        // Last segment? -> stop exactly at end
        if (!window.segments || curIdx >= window.segments.length - 1) {
          clearInterval(window.__seamlessInterval);
          window.__seamlessInterval = null;
          // Stop and do NOT roll into postlude
          try { a.pause(); } catch(_) {}
          try { b.pause(); } catch(_) {}
          window.currentlyPlaying = false;
          return;
        }

        if (jumped) return; // avoid double-processing the same tick
        jumped = true;
        const next = window.segments[curIdx + 1];
        const target = next.start;

        // Seamless in-place jump: DO NOT pause. Seek both up to the next start.
        try {
          if (typeof a.fastSeek === "function") a.fastSeek(target);
          else a.currentTime = target;
        } catch(_) { a.currentTime = target; }

        try {
          if (typeof b.fastSeek === "function") b.fastSeek(target);
          else b.currentTime = target;
        } catch(_) { b.currentTime = target; }

        // Ensure they remain "playing"
        try { a.play(); } catch(_) {}
        try { b.play(); } catch(_) {}

        // Advance our local pointers and UI hint (if used elsewhere)
        curIdx += 1;
        curEnd  = next.end;
        window.currentPlayingSegmentIndex = curIdx;

        // Allow next tick to process normally
        setTimeout(function(){ jumped = false; }, CHECK_EVERY_MS);
      }
    }, CHECK_EVERY_MS);
  };

  console.log("🔧 Seamless inter-segment handoff installed (mobile gap removed).");
})();

*/






/* ==========================================================
   ✅ Seamless inter-segment handoff (tighter boundary)
   - Paste at END of loopPlayer.js (no modules/imports)
   - Micro-adjusts end of segment (EPS_END) and check frequency (CHECK_EVERY_MS)
   - Ensures seamless continuity between segments (mobile-safe)

   -------
   Key Changes:

Tighter boundary detection (EPS_END): Now only 15 ms tolerance before a segment is considered finished.

Faster check frequency (CHECK_EVERY_MS): This is now 30 ms instead of the previous 50 ms, which increases the smoothness between segment transitions.

Seamless in-place jump: When a segment is finished, we jump forward in time without pausing, ensuring that there’s no gap in mobile playback.

   ========================================================== */
/*
(function () {
  if (window.__SEAMLESS_CHAIN_PATCH__) return;
  window.__SEAMLESS_CHAIN_PATCH__ = true;

  // Keep a reference to your current playSegment so we can re-use its start behavior
  var __origPlaySegment = window.playSegment;

  // Replace playSegment with a version that:
  //  - Starts the requested segment using your current logic
  //  - Then, for chain advance, uses an in-place jump (no pause, no re-call)
  window.playSegment = function (startTime, endTime, index) {
    if (typeof __origPlaySegment !== "function") return;

    // Start as you already do today (this preserves your perfect first start)
    __origPlaySegment.call(this, startTime, endTime, index);

    // After the original sets up and begins playback, install our seamless handoff loop
    const myRun = window.playRunId; // capture the run that __origPlaySegment just started
    const a = window.vocalAudio, b = window.accompAudio;
    if (!a || !b) return;

    // Small, safe constants (tuned tighter)
    const EPS_END   = 0.015; // 15 ms guard right at a boundary
    const DRIFT_FIX = 0.06;  // if accomp lags >60 ms, snap to vocal
    const CHECK_EVERY_MS = 30; // tighter check frequency (~33/s)

    // Manage current segment bounds locally; we mutate them when we jump
    let curIdx  = index|0;
    let curEnd  = endTime;
    let jumped  = false; // to avoid double-actions in one tick

    // Kill any previous handoff loop for older runs
    if (window.__seamlessInterval) {
      clearInterval(window.__seamlessInterval);
      window.__seamlessInterval = null;
    }

    window.__seamlessInterval = setInterval(function () {
      // If another start took over, stop this loop
      if (myRun !== window.playRunId) {
        clearInterval(window.__seamlessInterval);
        window.__seamlessInterval = null;
        return;
      }

      // Safety: if players vanished, stop
      if (!window.vocalAudio || !window.accompAudio) {
        clearInterval(window.__seamlessInterval);
        window.__seamlessInterval = null;
        return;
      }

      // Micro-resync (vocal = master): if accomp lags a lot, pull it forward
      const va = a.currentTime;
      const vb = b.currentTime;
      const lag = va - vb;
      if (lag > DRIFT_FIX) {
        try {
          if (typeof b.fastSeek === "function") b.fastSeek(va);
          else b.currentTime = va;
        } catch(_) { b.currentTime = va; }
      }

      // End-of-segment handling
      // We only change behavior HERE: no pause + no recursive playSegment call.
      // Instead, jump in-place to the next segment's start while staying "playing".
      if (va >= curEnd - EPS_END) {
        // Last segment? -> stop exactly at end
        if (!window.segments || curIdx >= window.segments.length - 1) {
          clearInterval(window.__seamlessInterval);
          window.__seamlessInterval = null;
          // Stop and do NOT roll into postlude
          try { a.pause(); } catch(_) {}
          try { b.pause(); } catch(_) {}
          window.currentlyPlaying = false;
          return;
        }

        if (jumped) return; // avoid double-processing the same tick
        jumped = true;
        const next = window.segments[curIdx + 1];
        const target = next.start;

        // Seamless in-place jump: DO NOT pause. Seek both up to the next start.
        try {
          if (typeof a.fastSeek === "function") a.fastSeek(target);
          else a.currentTime = target;
        } catch(_) { a.currentTime = target; }

        try {
          if (typeof b.fastSeek === "function") b.fastSeek(target);
          else b.currentTime = target;
        } catch(_) { b.currentTime = target; }

        // Ensure they remain "playing"
        try { a.play(); } catch(_) {}
        try { b.play(); } catch(_) {}

        // Advance our local pointers and UI hint (if used elsewhere)
        curIdx += 1;
        curEnd  = next.end;
        window.currentPlayingSegmentIndex = curIdx;

        // Allow next tick to process normally
        setTimeout(function(){ jumped = false; }, CHECK_EVERY_MS);
      }
    }, CHECK_EVERY_MS);
  };

  console.log("🔧 Seamless inter-segment handoff installed (mobile gap removed).");
})();

*/







/* ==========================================================
   🌐 Micro-priming overlay for v3 (Segment 2+ only, always on)
   - Drop-in: paste at END of loopPlayer.js (replace old overlay)
   - Segment 1 untouched
   - One tiny seek “tickle” once per segment boundary
   - No network check; still very light
   ========================================================== */
/*
(function () {
  if (window.__V3_MICRO_PRIME_OVERLAY_ALWAYS__) return;
  window.__V3_MICRO_PRIME_OVERLAY_ALWAYS__ = true;

  var __basePlaySegment = window.playSegment;
  if (typeof __basePlaySegment !== 'function') return;

  // Tunables (keep conservative; you can try 0.16–0.25 if needed)
  var LOOKAHEAD_WINDOW_S = 0.20; // 200 ms before boundary
  var RELEASE_MS = 20;           // re-entry guard

  function fastSeekOrSet(el, t){
    try { if (el && el.fastSeek) return el.fastSeek(t); } catch(_) {}
    try { if (el) el.currentTime = t; } catch(_) {}
  }

  window.playSegment = function (startTime, endTime, index) {
    // Run your existing v3 behavior (which skips segment 1’s seamless hook)
    __basePlaySegment.call(this, startTime, endTime, index);

    // Only enhance segments 2+
    if ((index|0) === 0) return;

    var myRun = window.playRunId;
    var a = window.vocalAudio, b = window.accompAudio;
    if (!a || !b) return;

    var jumping = false;
    var primedFor = -1;          // ensure we prime only once per segment
    var curIdx  = index|0;
    var curEnd  = endTime;

    // Kill previous overlay watcher if any
    if (window.__v3MicroPrimeStop) { try { window.__v3MicroPrimeStop(); } catch(_){} }

    var interval = setInterval(function(){
      // Abort if takeover or players gone
      if (myRun !== window.playRunId || !window.vocalAudio || !window.accompAudio) {
        clearInterval(interval); window.__v3MicroPrimeStop = null; return;
      }

      var va = a.currentTime;
      var timeToBoundary = (curEnd - va);

      // Next segment
      var next = (Array.isArray(window.segments) && curIdx < window.segments.length - 1)
        ? window.segments[curIdx + 1]
        : null;

      // One-time tiny tickle before boundary (always on)
      if (next && typeof next.start === 'number' &&
          primedFor !== curIdx &&          // only once per segment
          !jumping &&
          timeToBoundary > 0 &&
          timeToBoundary <= LOOKAHEAD_WINDOW_S) {

        primedFor = curIdx;                // mark as primed
        jumping = true;

        try {
          var returnTo = va;
          fastSeekOrSet(a, next.start);
          fastSeekOrSet(b, next.start);
          fastSeekOrSet(a, returnTo);
          fastSeekOrSet(b, returnTo);
        } catch (_) {}

        setTimeout(function(){ jumping = false; }, RELEASE_MS);
      }

      // If your base v3 logic advanced to next segment, update bounds & reset priming
      try {
        if (window.currentPlayingSegmentIndex === curIdx + 1 && next) {
          curIdx += 1;
          curEnd  = next.end;
          primedFor = -1;                  // allow priming for new segment
        }
      } catch(_) {}
    }, 25); // light; in line with v3’s check cadence

    window.__v3MicroPrimeStop = function(){ clearInterval(interval); };
  };

  console.log("🌐 v3 micro-priming overlay installed (always on, Segment 2+ only, one-time per boundary).");
})();


*/



