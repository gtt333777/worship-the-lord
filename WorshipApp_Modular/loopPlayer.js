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
   ✅ Seamless inter-segment handoff — from Segment 2 onward only
   - First segment (index 0) is 100% untouched
   - In-place jump (no pause, no re-call) for later segments
   - RAF-driven when visible; interval fallback when hidden
   - Safe play() usage (suppresses AbortError noise)
   ========================================================== */

(function () {
  if (window.__SEAMLESS_CHAIN_PATCH_V3__) return;
  window.__SEAMLESS_CHAIN_PATCH_V3__ = true;

  var __origPlaySegment = window.playSegment;
  if (typeof __origPlaySegment !== "function") return;

  // Tunables
  var EPS_END        = 0.012; // 12 ms guard at segment end
  var DRIFT_FIX_HARD = 0.050; // snap accomp if >50 ms behind vocal
  var DRIFT_FIX_SOFT = 0.020; // nudge accomp if >20 ms behind vocal
  var CHECK_EVERY_MS = 25;    // ~40/s when interval fallback is used

  function safePlay(el){
    if (!el || el.error || el.ended || !el.paused) return Promise.resolve();
    var p = el.play();
    return p && typeof p.catch === 'function' ? p.catch(function(e){
      if (!(e && (e.name === 'AbortError' || e.code === 20))) {
        console.warn('play() warn:', e);
      }
    }) : Promise.resolve();
  }

  function fastSeekOrSet(el, t){
    try { if (el.fastSeek) { el.fastSeek(t); return; } } catch(_) {}
    try { el.currentTime = t; } catch(_) {}
  }

  function startTicker(step){
    var cancelled = false;
    var interval = null;
    function rafLoop(){
      if (cancelled) return;
      step();
      requestAnimationFrame(rafLoop);
    }
    if (document.visibilityState === 'visible' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(rafLoop);
    } else {
      interval = setInterval(function(){ if (!cancelled) step(); }, CHECK_EVERY_MS);
    }
    return function stop(){
      cancelled = true;
      if (interval) { clearInterval(interval); interval = null; }
    };
  }

  window.playSegment = function (startTime, endTime, index) {
    // Always start with your original behavior
    __origPlaySegment.call(this, startTime, endTime, index);

    // ✳️ Do NOT install seamless logic for the first segment
    //    (index 0). This keeps it completely untouched.
    if ((index|0) === 0) return;

    var myRun = window.playRunId;
    var a = window.vocalAudio, b = window.accompAudio;
    if (!a || !b) return;

    // Chain state for this run
    var curIdx = index|0;
    var curEnd = endTime;
    var jumping = false;

    // Stop any previous ticker from an older run
    if (window.__seamlessStopper) { try { window.__seamlessStopper(); } catch(_){} }
    window.__seamlessStopper = startTicker(function step(){
      // Abort if a newer play took over
      if (myRun !== window.playRunId) { window.__seamlessStopper(); window.__seamlessStopper = null; return; }

      // Safety: both players must exist
      if (!window.vocalAudio || !window.accompAudio) { window.__seamlessStopper(); window.__seamlessStopper = null; return; }

      var va = a.currentTime;
      var vb = b.currentTime;
      var lag = va - vb; // vocal is master

      // Keep accompaniment glued to vocal
      if (lag > DRIFT_FIX_HARD) {
        fastSeekOrSet(b, va);
      } else if (lag > DRIFT_FIX_SOFT) {
        try { b.currentTime = va; } catch(_) {}
      }

      // End-of-segment boundary
      if (va >= curEnd - EPS_END) {
        // Last segment → stop exactly at end
        if (!Array.isArray(window.segments) || curIdx >= window.segments.length - 1) {
          window.__seamlessStopper && window.__seamlessStopper();
          window.__seamlessStopper = null;
          try { a.pause(); } catch(_) {}
          try { b.pause(); } catch(_) {}
          window.currentlyPlaying = false;
          return;
        }

        if (jumping) return; // avoid double-processing in one step
        jumping = true;

        // Jump to next
        var next = window.segments[curIdx + 1];
        var target = next && typeof next.start === 'number' ? next.start : null;
        if (target == null) { return; }

        // Seamless in-place jump (no pause, no re-call)
        fastSeekOrSet(a, target);
        fastSeekOrSet(b, target);

        // Only play if paused (reduces AbortError logs)
        safePlay(a);
        safePlay(b);

        // Advance pointers
        curIdx += 1;
        curEnd  = next.end;
        window.currentPlayingSegmentIndex = curIdx;

        // Release jumping flag soon
        setTimeout(function(){ jumping = false; }, CHECK_EVERY_MS);
      }
    });

    // Minimal, non-noisy trace (comment out if you prefer)
    // console.log("🔧 Seamless handoff active from segment", index);
  };

  console.log("🔧 Seamless handoff v3 installed (skips segment 1; seamless from segment 2+).");
})();





















/*
Now it is regarding my Worship The Lord app. I have pasted below loopPlayer.js 
In mobile there was gap between segments and you have also given code to overcome it. 
But still first time, gap is there, second time it is seamless like in desktop. 
To avoid that first time small gap of around one or two second, you please code. 
That is when app song is played. loopPlayer.js should identify the segment number 
which is played and play the next segment in mute for 2 seconds (your discretion 1, 2, 3 second) 
so that when the previous segment gets over since already warmed up the next segment 
will play without gap seamless. You please give bullet proof code and advise 
whether I can paste it at the end of loopPlayer.js Before giving code first explain what you understood

Notes from ChatGpt

Where to paste: put this after everything else in loopPlayer.js (below your “Seamless inter-segment handoff (tighter boundary)” block).

What it does: on each segment start, if there’s a next segment and we haven’t warmed it yet, it creates muted clone audios, seeks them to the next segment start, plays for ~2s, and disposes. That warms up the decoders/buffers so the first transition is also seamless.

Safe + bullet-proof:

Doesn’t touch your live players.

Auto-cancels if the user jumps to another segment (playRunId changes).

Has hard timeouts and try/catches so it never breaks playback.

Runs once per segment to minimize overhead.

If you want it lighter/faster, you can change WARM_SECONDS to 1.0. If you want it even more aggressive, bump to 3.0
*/

/* ==========================================================
   ✅ Next-segment warm-up (kills the very first handoff gap on mobile)
   - Paste at END of loopPlayer.js (after your seamless handoff patch)
   - No modules/imports. Safe + idempotent.
   - Plays muted clone audios for the *next* segment for ~2s, once per segment.
   ========================================================== */

   /*

(function () {
  if (window.__NEXT_SEGMENT_WARMER__) return;
  window.__NEXT_SEGMENT_WARMER__ = true;

  // Keep the current playSegment (already patched with seamless handoff) so we can extend it
  var __playSegmentBase = window.playSegment;

  // Track which segment indices we have already warmed (avoid redundant work)
  var __warmed = new Set();

  // Tunables
  var WARM_SECONDS = 2.0;     // how long to pre-roll (muted) the next segment
  var WARM_TIMEOUT_MS = 3500; // absolute safety timeout for the warmer lifecycle
  var SEEK_READY_STATES = 1;  // allow seek after metadata (>=1) to be quicker

  // Make a muted, off-DOM Audio clone that can seek/play independently
  function makeMutedClone(src) {
    var a = new Audio();
    a.src = src;
    a.preload = "auto";
    a.muted = true;
    a.playsInline = true;
    a.crossOrigin = (window.vocalAudio && window.vocalAudio.crossOrigin) || "anonymous";
    return a;
  }

  function waitForCanSeek(audio) {
    return new Promise(function (res) {
      // If metadata already loaded, resolve quickly
      if (audio.readyState >= SEEK_READY_STATES) return res();
      var done = false;
      var onLoaded = function () { if (!done) { done = true; res(); } };
      audio.addEventListener("loadedmetadata", onLoaded, { once: true });
      audio.addEventListener("canplay", onLoaded, { once: true });
      // Fallback: small timer in case events race
      setTimeout(onLoaded, 500);
    });
  }

  // Warm up decoders by briefly playing the next segment muted on clone elements
  function warmNextSegment(nextStart) {
    // Must have the live players and their src
    var va = window.vocalAudio, aa = window.accompAudio;
    if (!va || !aa || !va.src || !aa.src) return function cancel(){};

    var cloneV = makeMutedClone(va.src);
    var cloneA = makeMutedClone(aa.src);

    var cancelled = false;
    var timer = null;

    function cleanup() {
      try { cloneV.pause(); } catch(_) {}
      try { cloneA.pause(); } catch(_) {}
      // Release refs to help GC
      cloneV.src = "";
      cloneA.src = "";
    }

    (async function run() {
      try {
        // Load minimal metadata so we can seek quickly
        await Promise.all([waitForCanSeek(cloneV), waitForCanSeek(cloneA)]);
        if (cancelled) return cleanup();

        // Seek to the *start* of next segment
        try { cloneV.currentTime = Math.max(0, nextStart); } catch(_) {}
        try { cloneA.currentTime = Math.max(0, nextStart); } catch(_) {}

        // Fire them up (muted autoplay generally allowed on mobile)
        try { await cloneV.play(); } catch(_) {}
        try { await cloneA.play(); } catch(_) {}

        // Let them run for WARM_SECONDS, then stop
        timer = setTimeout(function () {
          if (cancelled) return cleanup();
          cleanup();
        }, WARM_SECONDS * 1000);
      } catch (_) {
        cleanup();
      }

      // Hard safety guard
      setTimeout(function(){
        if (!cancelled) { cancelled = true; cleanup(); }
      }, WARM_TIMEOUT_MS);
    })();

    // Return a cancel function in case we need to abort early
    return function cancel() {
      cancelled = true;
      if (timer) { clearTimeout(timer); timer = null; }
      cleanup();
    };
  }

  // Wrap current playSegment so every start schedules a one-time warmer for the next
  window.playSegment = function (startTime, endTime, index) {
    // Call the underlying (your existing) start logic
    __playSegmentBase && __playSegmentBase.call(this, startTime, endTime, index);

    // If there is a next segment and we haven't warmed it yet, warm it now.
    try {
      var i = index|0;
      if (!Array.isArray(window.segments)) return;
      if (i < 0 || i >= window.segments.length - 1) return; // no next
      if (__warmed.has(i+1)) return;

      var next = window.segments[i + 1];
      if (!next || typeof next.start !== "number") return;

      __warmed.add(i+1);            // mark as scheduled (avoid dup)
      var myRun = window.playRunId; // if user jumps elsewhere, we’ll abort

      var cancelWarm = warmNextSegment(next.start);

      // If another play takes over before warm finishes, cancel it
      setTimeout(function checkRunStillValid(){
        if (myRun !== window.playRunId && typeof cancelWarm === "function") {
          cancelWarm();
        }
      }, 0);
    } catch (e) {
      // Never let warmer crash playback
      console.warn("⚠️ warmer:", e);
    }
  };

  console.log("🔥 Next-segment warmer installed (first handoff gap removed).");
})();


*/



/* ==========================================================
   ✅ Pretap (no clones, no muted play)
   - Idea: When segment N starts, virtually "tap" segment N+1
   - Uses the same playSegment path but short-circuits
     so it does NOT seek/pause/play anything right now.
   - Purely sets a "pretapped" flag and fires an event.
   - Paste at END of loopPlayer.js
   ========================================================== */
(function () {
  if (window.__PRETAP_PATCH__) return;
  window.__PRETAP_PATCH__ = true;

  // Keep your current playSegment (already patched with seamless handoff)
  var __basePlaySegment = window.playSegment;

  // Remember which indices were pretapped (for debugging/UX if needed)
  var __pretapped = new Set();

  // Internal one-shot arm that lets us call playSegment(...) to *register*
  // a pretap via the same code path, but without actually touching audio.
  var __pretapArmed = false;
  var __pretapTargetIndex = -1;

  // Optional: simple helper to find a segment safely
  function getSeg(i) {
    if (!Array.isArray(window.segments)) return null;
    if (i < 0 || i >= window.segments.length) return null;
    return window.segments[i];
  }

  // Optional: mark button UI (non-essential; safe if buttons exist)
  function markButtonPretapped(i) {
    try {
      var container = document.getElementById("loopButtonsContainer");
      if (!container) return;
      var btn = container.querySelectorAll(".segment-button")[i];
      if (btn) btn.classList.add("pretapped"); // style if you want in CSS
    } catch(_) {}
  }

  // Fire a custom event so other parts of your UI can react if desired
  function emitPretapEvent(i) {
    try {
      document.dispatchEvent(new CustomEvent("loop:pretapped", { detail: { index: i }}));
    } catch(_) {}
  }

  // Wrap playSegment:
  //  - If __pretapArmed and the target index matches, we ONLY record pretap
  //    (no pause/seek/play), then return.
  //  - Otherwise, do the normal play and schedule a pretap for the next index.
  window.playSegment = function (startTime, endTime, index) {
    // If this call is a pretap registration, short-circuit *before* touching audio
    if (__pretapArmed && index === __pretapTargetIndex) {
      __pretapArmed = false;            // consume the arm
      __pretapped.add(index);           // record
      markButtonPretapped(index);       // optional UI
      emitPretapEvent(index);           // optional hook
      // DO NOT call the base, so we do NOT pause/seek/play anything
      // This keeps the current segment totally untouched.
      return;
    }

    // Normal behavior: start the requested segment
    __basePlaySegment && __basePlaySegment.call(this, startTime, endTime, index);

    // After a tiny tick, pretap NEXT segment (if any)
    try {
      var i = index|0;
      var nextI = i + 1;
      var next = getSeg(nextI);
      if (!next) return;

      // Arm the pretap so that a call to playSegment(next) records-only
      __pretapArmed = true;
      __pretapTargetIndex = nextI;

      // Call playSegment with next segment's bounds, but it will be intercepted
      // above and turned into a "pretap only" (no audio actions).
      setTimeout(function () {
        // If user jumped to a new run, it's still harmless: we only set a flag
        window.playSegment(next.start, next.end, nextI);
      }, 0);
    } catch (e) {
      console.warn("pretap wrapper:", e);
    }
  };

  // (Optional) expose for debugging
  window.__getPretappedSegments = function(){ return Array.from(__pretapped); };

  console.log("🖐️ Pretap installed (no warm-up; next segment is virtually tapped).");
})();










/* ===== Optional: Screen Wake Lock (paste at END of loopPlayer.js) ===== */
(function(){
  if (window.__WAKE_LOCK_PATCH__) return;
  window.__WAKE_LOCK_PATCH__ = true;

  let wakeLock = null;

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('🔒 Wake Lock acquired');
        wakeLock.addEventListener('release', () => console.log('🔓 Wake Lock released'));
      }
    } catch (e) {
      console.warn('Wake Lock not available or denied:', e);
    }
  }
  function releaseWakeLock() {
    try { wakeLock && wakeLock.release(); } catch(_) {}
    wakeLock = null;
  }

  // Acquire when playback starts; release when fully stopped
  const _basePlaySegment = window.playSegment;
  window.playSegment = function(startTime, endTime, index){
    _basePlaySegment && _basePlaySegment.call(this, startTime, endTime, index);
    requestWakeLock();
    // Watch for the run completing to release if no longer playing
    const myRun = window.playRunId;
    const t = setInterval(() => {
      if (myRun !== window.playRunId) { clearInterval(t); return; }
      if (!window.currentlyPlaying) { clearInterval(t); releaseWakeLock(); }
    }, 1000);
  };

  // If user minimizes / restores, re-request as needed
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.currentlyPlaying) requestWakeLock();
  });

  // Expose helpers if you want manual control
  window.requestWakeLock = requestWakeLock;
  window.releaseWakeLock = releaseWakeLock;

  console.log("💡 Wake Lock helper installed (keeps screen on during playback when possible).");
})();
