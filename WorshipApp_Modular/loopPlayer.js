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
   ✅ Guard: Play-alone does nothing; user must tap Segment 1
   - Paste at the END of loopPlayer.js
   - No modules/imports; global-safe
   - Blocks auto Segment 1 starts from Play
   - Also neuters checkReadyAndPlay() until Segment 1 is tapped
   ========================================================== */
(function () {
  if (window.__PLAY_GUARD_INSTALLED__) return;
  window.__PLAY_GUARD_INSTALLED__ = true;

  // User must explicitly tap "Segment 1" to enable playback.
  // Reset to false on every song change.
  window.__SEG1_ALLOWED__ = false;

  // Install AFTER both functions exist (they’re globals from your split scripts)
  function install() {
    if (typeof window.playSegment !== "function" || typeof window.checkReadyAndPlay !== "function") {
      setTimeout(install, 0);
      return;
    }

    // --- 1) Block auto Segment 1 starts (e.g., from Play path) until user taps Segment 1
    const __origPlaySegment = window.playSegment;
    window.playSegment = function (startTime, endTime, index) {
      if (index === 0 && !window.__SEG1_ALLOWED__) {
        console.log("[Guard] Ignoring Segment 1 auto-start — wait for user tap.");
        return;
      }
      return __origPlaySegment.call(this, startTime, endTime, index);
    };

    // --- 2) Neuter checkReadyAndPlay() while guard is active (so Play alone won’t start audio)
    const __origCheckReadyAndPlay = window.checkReadyAndPlay;
    window.checkReadyAndPlay = function () {
      if (window.__SEG1_ALLOWED__) return __origCheckReadyAndPlay.call(this);

      // Wait for readiness but DO NOT call .play() on either element
      return new Promise((resolve) => {
        const a = window.vocalAudio, b = window.accompAudio;

        function ready(el) {
          return new Promise((res) => {
            if (!el) return res();
            if (el.readyState >= 2) return res();
            el.addEventListener("canplaythrough", () => res(), { once: true });
          });
        }

        Promise.all([ready(a), ready(b)]).then(resolve);
      });
    };

    // --- 3) Detect user’s explicit tap on the Segment 1 button (capture phase, before existing handler)
    document.addEventListener(
      "click",
      function (ev) {
        const t = ev.target;
        if (!t) return;
        if (t.classList && t.classList.contains("segment-button")) {
          const txt = (t.textContent || "").trim();
          // Your buttons are labeled "Segment 1", "Segment 2", ...
          if (/^Segment\s*1$/i.test(txt)) {
            window.__SEG1_ALLOWED__ = true;
            console.log("[Guard] User tapped Segment 1 — playback enabled.");
          }
        }
      },
      true // capture so this runs before the existing click listener
    );

    // --- 4) Reset the guard when user picks a new song
    const onReady = () => {
      const dd = document.getElementById("songSelect");
      if (dd) {
        dd.addEventListener(
          "change",
          () => {
            window.__SEG1_ALLOWED__ = false;
            console.log("[Guard] New song selected — Segment 1 tap required again.");
          },
          { capture: true }
        );
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  }

  // Start installer now (and retry shortly if functions not defined yet)
  install();
})();
