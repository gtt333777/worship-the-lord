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
   ✅ Single Guard: Play arms a 6s window; only Segment 1 can start
   - Paste at END of loopPlayer.js (remove older end patches)
   - Global/split-script safe; uses your existing checkReadyAndPlay() & getDropboxFileURL()
   ========================================================== */
(function () {
  if (window.__S1_PLAY_WINDOW_GUARD__) return;
  window.__S1_PLAY_WINDOW_GUARD__ = true;

  var WINDOW_MS = 6000;    // 6s grace window after Play
  var armedUntil = 0;      // timestamp (ms) until which S1 tap is accepted
  var disarmTimer = null;
  var startedOnce = false; // set true after the very first S1 start
  var startingNow = false; // debounce while orchestrating start

  function now() { return Date.now(); }

  function disarm(reason) {
    armedUntil = 0;
    if (disarmTimer) { clearTimeout(disarmTimer); disarmTimer = null; }
    if (reason) console.log("[Guard] Disarmed:", reason);
  }

  function armWindow() {
    armedUntil = now() + WINDOW_MS;
    if (disarmTimer) clearTimeout(disarmTimer);
    disarmTimer = setTimeout(() => disarm("window expired"), WINDOW_MS + 50);
    console.log("[Guard] Play armed a", WINDOW_MS, "ms window. Tap Segment 1 to start.");
  }

  // Warm audio + ensure segments JSON, then start S1 once
  function startSegment1Cleanly() {
    if (startingNow) return;
    startingNow = true;

    const dd = document.getElementById("songSelect");
    const a  = window.vocalAudio;
    const b  = window.accompAudio;
    if (!dd || !dd.value || !a || !b) { startingNow = false; return; }

    const songName = dd.value;

    // Ensure segments are loaded (trigger 'change' if needed, then wait up to ~2s)
    function ensureSegmentsReady() {
      if (window.segments && window.segments.length > 0) return Promise.resolve();
      // trigger the existing loader bound to 'change'
      dd.dispatchEvent(new Event("change"));
      return new Promise((resolve) => {
        const t0 = now();
        const t = setInterval(() => {
          if (window.segments && window.segments.length > 0) { clearInterval(t); resolve(); }
          else if (now() - t0 > 2000) { clearInterval(t); resolve(); /* continue anyway */ }
        }, 50);
      });
    }

    // Ensure audio sources + warm both players using your existing function
    function warmAudio() {
      // set sources if missing or for a different song
      const vName = songName + "_vocal.mp3";
      const kName = songName + "_acc.mp3";
      const needV = !a.src || a.src.indexOf(vName) === -1;
      const needK = !b.src || b.src.indexOf(kName) === -1;

      if (typeof window.getDropboxFileURL === "function") {
        if (needV) a.src = window.getDropboxFileURL(vName);
        if (needK) b.src = window.getDropboxFileURL(kName);
      }
      a.preload = "auto";
      b.preload = "auto";

      // Warm both tracks together
      if (typeof window.checkReadyAndPlay === "function") {
        window.audioReadyPromise = window.checkReadyAndPlay();
        return window.audioReadyPromise;
      }
      // Fallback: resolve immediately
      return Promise.resolve();
    }

    Promise.all([ensureSegmentsReady(), warmAudio()]).then(() => {
      // Start Segment 1 via your normal segment path
      const seg = window.segments && window.segments[0];
      if (seg && typeof window.playSegment === "function") {
        console.log("[Guard] Starting Segment 1 (clean, armed start).");
        window.playSegment(seg.start, seg.end, 0);
        startedOnce = true;
        disarm("started");
      }
    }).catch(() => {
      /* ignore */
    }).finally(() => {
      startingNow = false;
    });
  }

  // ---- Capture Play clicks: arm window, do NOT let original Play handler run
  function installPlayCapture() {
    function handler(ev) {
      // Always block default Play behavior
      ev.stopImmediatePropagation();
      ev.stopPropagation();
      ev.preventDefault();

      // If already started or currently playing, we still ignore Play
      if (startedOnce || window.currentlyPlaying) {
        console.log("[Guard] Play ignored (already started / playing).");
        return;
      }
      armWindow();
    }

    function hook() {
      const btn = document.getElementById("playBtn");
      if (!btn) { setTimeout(hook, 50); return; }
      // capture to beat the original listener
      btn.addEventListener("click", handler, true);
      // backup capture at document level in case of nested icons inside the button
      document.addEventListener("click", function (ev) {
        if (ev.target === btn || (btn.contains && btn.contains(ev.target))) handler(ev);
      }, true);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
  }

  // ---- Capture Segment button clicks
  function installSegmentCapture() {
    document.addEventListener("click", function (ev) {
      const t = ev.target;
      if (!t || !t.classList || !t.classList.contains("segment-button")) return;

      const label = (t.textContent || "").trim();
      const m = /^Segment\s*(\d+)$/i.exec(label);
      if (!m) return;

      const idx = parseInt(m[1], 10) - 1;

      // If first start hasn’t happened yet…
      if (!startedOnce) {
        // Only allow Segment 1, and only inside the Play-armed window
        if (idx !== 0) {
          // block S2..N before first start
          ev.stopImmediatePropagation(); ev.stopPropagation(); ev.preventDefault();
          console.log("[Guard] Ignore Segment", idx + 1, "— start with Play → Segment 1.");
          return;
        }
        if (now() > armedUntil) {
          // either Play not pressed yet or window expired
          ev.stopImmediatePropagation(); ev.stopPropagation(); ev.preventDefault();
          console.log("[Guard] Segment 1 ignored — press Play first, then Segment 1 within", WINDOW_MS, "ms.");
          return;
        }
        // Inside the window & it is Segment 1 → we take over and start cleanly
        ev.stopImmediatePropagation(); ev.stopPropagation(); ev.preventDefault();
        startSegment1Cleanly();
        return;
      }

      // After first start: allow all segments normally (no blocking)
      // (do not prevent the event)
    }, true); // capture
  }

  // ---- Reset guard on song change
  function installSongChangeReset() {
    function hook() {
      const dd = document.getElementById("songSelect");
      if (!dd) { setTimeout(hook, 50); return; }
      dd.addEventListener("change", function () {
        startedOnce = false;
        disarm("song changed");
        console.log("[Guard] Reset for new song — press Play then Segment 1.");
      }, { capture: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
  }

  installPlayCapture();
  installSegmentCapture();
  installSongChangeReset();
})();
