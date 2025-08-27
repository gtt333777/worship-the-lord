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
   ✅ First-segment stabilizer v3 (no mute, no pause, fixed timers)
   - Works for manual tap and auto-start of Segment 1
   - Runs ONCE per song (auto-resets on song change)
   - Hooks BEFORE your original playSegment executes
   - Does a precise double re-seek to start while playing
   ========================================================== */
(function () {
  if (window.__S1_STAB_V3__) return;
  window.__S1_STAB_V3__ = true;

  // "once per song" flag
  if (typeof window.__FIRST_TAP_BOOST_DONE === "undefined") {
    window.__FIRST_TAP_BOOST_DONE = false;
  }

  // Safe seek that uses fastSeek when available
  function seekMedia(el, t) {
    try {
      if (typeof el.fastSeek === "function") el.fastSeek(t);
      else el.currentTime = t;
    } catch (e) {
      el.currentTime = t;
    }
  }

  // Keep a handle to the original function
  var __origPlaySegment = window.playSegment;

  // Override that wraps the original, arming the stabilizer for Segment 1 only
  window.playSegment = function (startTime, endTime, index) {
    var a = window.vocalAudio, b = window.accompAudio;
    var needFix = (index === 0 && !window.__FIRST_TAP_BOOST_DONE && a && b);

    // Declare all state/timers up front (fixes "timer2 is not defined")
    var fired = false, timer = null, timer2 = null;
    var seen = { aPlay:false, bPlay:false, aTU:false, bTU:false };

    function cleanup() {
      if (a) {
        a.removeEventListener("playing", onA);
        a.removeEventListener("timeupdate", onATU);
      }
      if (b) {
        b.removeEventListener("playing", onB);
        b.removeEventListener("timeupdate", onBTU);
      }
      if (timer) clearTimeout(timer);
      if (timer2) clearTimeout(timer2);
    }

    function go() {
      if (fired) return;
      fired = true;
      cleanup();
      window.__FIRST_TAP_BOOST_DONE = true;

      // Do what your manual 2nd tap does: align now, then reinforce once more
      seekMedia(a, startTime);
      seekMedia(b, startTime);
      timer2 = setTimeout(function () {
        seekMedia(a, startTime);
        seekMedia(b, startTime);
      }, 120);
    }

    function check() {
      // Fire once both streams have proved they are emitting frames,
      // or when both delivered a first timeupdate (some mobiles prefer TU)
      if ((seen.aPlay && seen.bPlay) || (seen.aTU && seen.bTU)) go();
    }
    function onA()  { seen.aPlay = true; check(); }
    function onB()  { seen.bPlay = true; check(); }
    function onATU(){ seen.aTU   = true; check(); }
    function onBTU(){ seen.bTU   = true; check(); }

    // Attach listeners BEFORE calling the original (so we cannot miss early events)
    if (needFix) {
      a.addEventListener("playing",    onA,  { once:true });
      b.addEventListener("playing",    onB,  { once:true });
      a.addEventListener("timeupdate", onATU, { once:true });
      b.addEventListener("timeupdate", onBTU, { once:true });

      // Fallback for slow devices/browsers: still enforce after a short grace
      // (tune 350→450ms if a specific phone still juggles)
      timer = setTimeout(go, 450);
    }

    // Run your original logic
    return __origPlaySegment.call(this, startTime, endTime, index);
  };

  // Reset the “once per song” flag when the song changes
  document.addEventListener("DOMContentLoaded", function () {
    var dd = document.getElementById("songSelect");
    if (dd) dd.addEventListener("change", function () {
      window.__FIRST_TAP_BOOST_DONE = false;
    }, { capture: true });
  });
})();

