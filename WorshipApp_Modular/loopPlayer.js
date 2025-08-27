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
   ✅ First-segment A→B→A bounce (warmup) — paste at END of file
   - No pause(), no volume/mute
   - Lets S1 play a hair, hops to S2 briefly, then returns to S1
   - Uses playRunId so the latest call always wins
   - Runs ONCE per song; resets on song change
   ========================================================== */
(function () {
  if (window.__S1_ABA_BOUNCE__) return;
  window.__S1_ABA_BOUNCE__ = true;

  // once-per-song guard
  if (typeof window.__S1_BOUNCED_ONCE === "undefined") window.__S1_BOUNCED_ONCE = false;

  // Tunables (safe defaults for many phones)
  var S1_RUN_SEC   = 0.09;   // how much real progress to allow on S1 before hopping
  var S2_RUN_SEC   = 0.09;   // how much real progress to allow on S2 before returning
  var S1_FALLBACK  = 600;    // ms max to wait for the S1 tiny run
  var S2_FALLBACK  = 500;    // ms max to wait for the S2 tiny run
  var REINFORCE_MS = 120;    // extra “virtual tap” back on S1 after returning

  // Helper: wait until the leading currentTime has advanced by `deltaSec` from `base`,
  // or until fallback deadline, while ensuring we haven’t been superseded by a newer playRunId.
  function waitProgress(expectedRunId, base, deltaSec, fallbackMs) {
    return new Promise(function (resolve, reject) {
      var a = window.vocalAudio, b = window.accompAudio;
      if (!a || !b) return resolve(); // if missing, just continue gracefully

      var deadline = performance.now() + fallbackMs;

      function tick() {
        // If a newer play took over, abort quietly
        if (window.playRunId !== expectedRunId) return reject(new Error("superseded"));

        var lead = Math.max(a.currentTime || 0, b.currentTime || 0);
        if (lead >= base + deltaSec) return resolve();

        if (performance.now() >= deadline) return resolve(); // give up waiting; continue

        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // Keep original
  var __origPlaySegment = window.playSegment;

  // Wrap global playSegment
  window.playSegment = function (startTime, endTime, index) {
    var segs = window.segments || [];
    var hasSeg2 = !!(segs && segs.length > 1 && segs[1]);

    // Only on the VERY FIRST request for Segment 1 per song
    if (index === 0 && !window.__S1_BOUNCED_ONCE) {
      window.__S1_BOUNCED_ONCE = true;

      // Start S1 normally
      __origPlaySegment.call(this, startTime, endTime, 0);
      var runIdS1 = window.playRunId;

      // Allow a hair of real playback on S1
      waitProgress(runIdS1, startTime, S1_RUN_SEC, S1_FALLBACK).then(function () {
        // If a newer play took over, do nothing
        if (window.playRunId !== runIdS1) return;

        if (hasSeg2) {
          // Hop to S2 briefly
          var s2 = segs[1];
          __origPlaySegment.call(window, s2.start, s2.end, 1);
          var runIdS2 = window.playRunId;

          // Let S2 actually run a hair too
          waitProgress(runIdS2, s2.start, S2_RUN_SEC, S2_FALLBACK).then(function () {
            if (window.playRunId !== runIdS2) return;

            // Return to S1 (this is the "virtual tap" users do)
            __origPlaySegment.call(window, startTime, endTime, 0);

            // Optional: reinforce once more shortly (latest call wins)
            setTimeout(function () {
              // If user hasn’t moved on, reinforce S1 once
              __origPlaySegment.call(window, startTime, endTime, 0);
            }, REINFORCE_MS);
          }).catch(function(){ /* superseded; ignore */ });
        } else {
          // No Segment 2: just re-tap S1 now and reinforce once
          __origPlaySegment.call(window, startTime, endTime, 0);
          setTimeout(function () {
            __origPlaySegment.call(window, startTime, endTime, 0);
          }, REINFORCE_MS);
        }
      }).catch(function(){ /* superseded; ignore */ });

      // We handled first S1 request—don’t run the normal call again
      return;
    }

    // Normal behavior for everything else (S1 after first time, S2…N)
    return __origPlaySegment.call(this, startTime, endTime, index);
  };

  // Reset guard when user changes song
  document.addEventListener("DOMContentLoaded", function () {
    var dd = document.getElementById("songSelect");
    if (dd) dd.addEventListener("change", function () {
      window.__S1_BOUNCED_ONCE = false;
    }, { capture: true });
  });
})();
