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
  // window.vocalAudio.pause();
  // window.accompAudio.pause();
  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;
  try { window.vocalAudio.play(); } catch (e) {}
  try { window.accompAudio.play(); } catch (e) {}

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

        // window.vocalAudio.pause();
        // window.accompAudio.pause();
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
              // (Removed mobile-unstable auto-retries 70/140/210ms)
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
   ✅ Unified Start (Play == Play+S1, Segment == Play+Segment)
   - Paste at END of loopPlayer.js (remove previous end patches)
   - Global/split-script safe (no modules/imports)
   - Intercepts Play/Segment clicks (capture) and routes both
     through ONE clean warm-up path, then calls playSegment once.
   ========================================================== */
(function () {
  if (window.__UNIFIED_START_PATCH__) return;
  window.__UNIFIED_START_PATCH__ = true;

  var SEG_WAIT_MS = 2000;   // wait up to 2s for loops JSON
  var pendingLaunch = false; // debounce to avoid double orchestration

  function now() { return Date.now(); }

  function setSrcIfNeeded(a, b, songName) {
    if (!a || !b || !songName) return;
    var vName = songName + "_vocal.mp3";
    var kName = songName + "_acc.mp3";

    var needV = !a.src || a.src.indexOf(vName) === -1;
    var needK = !b.src || b.src.indexOf(kName) === -1;

    if (typeof window.getDropboxFileURL === "function") {
      if (needV) a.src = window.getDropboxFileURL(vName);
      if (needK) b.src = window.getDropboxFileURL(kName);
    }
    a.preload = "auto";
    b.preload = "auto";
  }

  function ensureSegmentsReady(dd) {
    return new Promise(function (resolve) {
      if (window.segments && window.segments.length > 0) return resolve();
      // trigger existing fetch bound to 'change'
      if (dd) dd.dispatchEvent(new Event("change"));
      var t0 = now();
      var t = setInterval(function () {
        if (window.segments && window.segments.length > 0) { clearInterval(t); resolve(); }
        else if (now() - t0 > SEG_WAIT_MS) { clearInterval(t); resolve(); } // proceed anyway
      }, 50);
    });
  }

  function warmAudio() {
    if (typeof window.checkReadyAndPlay === "function") {
      window.audioReadyPromise = window.checkReadyAndPlay();
      return window.audioReadyPromise;
    }
    // Fallback: minimal resolve to continue
    return Promise.resolve();
  }

  function orchestrateStart(targetIndex) {
    if (pendingLaunch) return;
    pendingLaunch = true;

    var dd = document.getElementById("songSelect");
    var a  = window.vocalAudio;
    var b  = window.accompAudio;

    if (!dd || !dd.value) {
      console.warn("[Unified] No song selected.");
      pendingLaunch = false;
      return;
    }
    if (!a || !b) {
      console.warn("[Unified] Audio elements not ready.");
      pendingLaunch = false;
      return;
    }

    var songName = dd.value;

    // 1) Ensure sources set & preloading
    setSrcIfNeeded(a, b, songName);

    // 2) Warm both players (starts them when ready)
    // 3) Ensure segments JSON present
    Promise.all([ warmAudio(), ensureSegmentsReady(dd) ]).then(function () {
      var segs = window.segments || [];
      if (!segs.length) {
        console.warn("[Unified] Segments not available; cannot start.");
        return;
      }

      // Clamp target index into range; default to 0 (Segment 1)
      var idx = Math.max(0, Math.min(targetIndex|0, segs.length - 1));
      var seg = segs[idx];

      // 4) Start the requested segment via your normal path
      if (typeof window.playSegment === "function") {
        console.log("[Unified] Starting Segment", idx + 1, "via unified path.");
        window.playSegment(seg.start, seg.end, idx);
      }
    }).catch(function (e) {
      console.warn("[Unified] Orchestration error:", e);
    }).finally(function () {
      // small delay before allowing another orchestration
      setTimeout(function(){ pendingLaunch = false; }, 50);
    });
  }

  // ---- Capture Play clicks: route to Segment 1
  (function installPlayCapture() {
    function handler(ev) {
      ev.stopImmediatePropagation();
      ev.stopPropagation();
      ev.preventDefault();
      orchestrateStart(0); // Segment 1
    }
    function hook() {
      var btn = document.getElementById("playBtn");
      if (!btn) { setTimeout(hook, 50); return; }
      btn.addEventListener("click", handler, true); // capture beats original
      // Backup capture for icon/child clicks inside the button
      document.addEventListener("click", function (ev) {
        if (ev.target === btn || (btn.contains && btn.contains(ev.target))) handler(ev);
      }, true);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
  })();

  // ---- Capture Segment button clicks: route to that segment
  (function installSegmentCapture() {
    function isSegmentButton(el) {
      return !!(el && el.classList && el.classList.contains("segment-button"));
    }
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!isSegmentButton(t)) return;

      var label = (t.textContent || "").trim();
      var m = /^Segment\s*(\d+)$/i.exec(label);
      if (!m) return;

      ev.stopImmediatePropagation();
      ev.stopPropagation();
      ev.preventDefault();

      var idx = (parseInt(m[1], 10) || 1) - 1;
      orchestrateStart(idx);
    }, true); // capture
  })();
})();





/* ==========================================================
   ✅ Per-Segment Fast Align Booster (paste at END of file)
   - Runs for ~0.8s at the start of EVERY segment
   - No pause(), no volume changes, no restarts
   - Aligns accompaniment to vocal each animation frame
   - Respects playRunId (stops if a newer play begins)
   ========================================================== */
(function () {
  if (window.__ALL_SEG_TIGHTSYNC__) return;
  window.__ALL_SEG_TIGHTSYNC__ = true;

  var BOOST_MS  = 800;   // duration of the fast-align window (try 700–1100 if needed)
  var SNAP_EPS  = 0.008; // snap if drift > 8 ms (try 0.005–0.012 if needed)
  var END_GUARD = 0.02;  // don’t interfere in the last 20 ms of the segment

  function fastAlignWindow(endTime, runId) {
    var a = window.vocalAudio, b = window.accompAudio;
    if (!a || !b) return;

    var stopAt = performance.now() + BOOST_MS;
    var rafId;

    function tick() {
      // stop if another play/segment took over
      if (runId !== window.playRunId) return;
      if (!window.vocalAudio || !window.accompAudio) return;

      var now = performance.now();
      if (now >= stopAt) return;

      var va = window.vocalAudio.currentTime;
      var vb = window.accompAudio.currentTime;

      // avoid touching right at the very end of the segment
      if (typeof endTime === "number" && va >= endTime - END_GUARD) return;

      // make accompaniment follow vocal (vocal = master clock)
      var drift = va - vb;
      if (drift > SNAP_EPS) {
        try { 
          if (typeof window.accompAudio.fastSeek === "function") window.accompAudio.fastSeek(va);
          else window.accompAudio.currentTime = va;
        } catch (_) {
          window.accompAudio.currentTime = va;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  // Wrap the existing global playSegment to start the booster for every segment
  var __origPlaySegment = window.playSegment;
  window.playSegment = function (startTime, endTime, index) {
    var r = __origPlaySegment && __origPlaySegment.call(this, startTime, endTime, index);

    // capture the current run id after the call (original increments it)
    var runId = window.playRunId || 0;

    // begin fast alignment for this segment
    Promise.resolve().then(function () {
      fastAlignWindow(endTime, runId);
    });

    return r;
  };
})();
