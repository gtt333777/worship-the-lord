// WorshipApp_Modular/loopPlayer.js
console.log("🎵 loopPlayer.js: Starting...");


window.stopAtSegmentIndex = null;


// ⭐ Safe default volume initializer (does NOT override perSongVolumeMemory)
window.addEventListener("DOMContentLoaded", () => {
  try {
    const savedVocal = localStorage.getItem("vocalVolume");
    const savedAcc   = localStorage.getItem("musicVolume");  // accomp = music

    // Apply default only if no saved volume exists
    if (window.vocalAudio && savedVocal === null) {
      window.vocalAudio.volume = 0.5;
    }
    if (window.accompAudio && savedAcc === null) {
      window.accompAudio.volume = 0.5;
    }
  } catch (e) {
    console.warn("Volume init error", e);
  }
});








window.segments = [];
window.currentlyPlaying = false;
window.activeSegmentTimeout = null;   // kept for compatibility (cleared on play)
window.activeSegmentInterval = null;  // watchdog interval (new)
window.playRunId = 0;                 // cancels older overlapping plays (new)


/*
function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not present yet, will start after ready...");
    return;
  }

  */

  function playSegment(startTime, endTime, index = 0) {


  // 🚫 Ignore segment triggers during auto-shared-play
if (window.ignoreSegments) {
  console.log("⛔ Segment ignored during shared auto-play");
  return;
}


  window.currentPlayingSegmentIndex = index;   // ⭐ FIX ADDED HERE

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


      /* ⭐ HIGHLIGHTER ROUTING ⭐ */
var t = window.vocalAudio.currentTime;
window.currentAudioTime = t;      // store for buttons

if (window.charModeEnabled) {
    if (typeof window.updateCharModeHighlight === "function") {
        window.updateCharModeHighlight(t);
    }
} else {
    if (typeof window.updateLyricsHighlight === "function") {
        window.updateLyricsHighlight(t);
    }
}
/* ⭐ END ⭐ */


      /* =====================================================
         ⭐ LIVE SEGMENT COUNTDOWN ON BUTTON (S1 - 15s)
         - Minimal & clean, updates visually once per second (using ceiling)
         - Non-invasive: only updates text content of the active button
         - Stores original label in dataset.originalLabel (first time)
         ===================================================== */
      try {
        // Guard: we need the buttons and a valid index
        const buttons = document.querySelectorAll(".segment-button");
        if (buttons && buttons.length && typeof index === "number") {
          const activeBtn = buttons[index];
          if (activeBtn) {
            // Store original once
            if (!activeBtn.dataset.originalLabel) {
              activeBtn.dataset.originalLabel = activeBtn.textContent.trim();
            }

            // Compute remaining seconds (ceil so singer sees whole seconds left)
            const remainingRaw = endTime - window.vocalAudio.currentTime;
            const remaining = (remainingRaw > 0) ? Math.ceil(remainingRaw) : 0;

            // Only show countdown while this segment is the current playing segment
            if (window.currentPlayingSegmentIndex === index && window.currentlyPlaying) {
              // Keep it minimal & clean: "S1 - 15s"
              activeBtn.textContent = `S${index + 1} - ${remaining}s`;
            } else {
              // If not playing, ensure label resets to original
              if (activeBtn.dataset.originalLabel) {
                activeBtn.textContent = activeBtn.dataset.originalLabel;
              }
            }
          }
        }
      } catch (e) {
        // Non-fatal: don't disturb playback if UI update fails
        // console.warn("Countdown update error:", e);
      }


      // End of segment?
      if (window.vocalAudio.currentTime >= endTime - EPS) {


      // ⭐ STOP-AT-END FEATURE
if (window.stopAtSegmentIndex === index) {
  if (window.vocalAudio.currentTime >= endTime - 0.05) {
    console.log("⛔ Stopping at end of segment", index + 1);

    clearInterval(window.activeSegmentInterval);
    window.activeSegmentInterval = null;

    window.vocalAudio.pause();
    window.accompAudio.pause();
    window.currentlyPlaying = false;

    return; // ⛔ DO NOT AUTO-ADVANCE
  }
}


        clearInterval(window.activeSegmentInterval);
        window.activeSegmentInterval = null;

        window.vocalAudio.pause();
        window.accompAudio.pause();
        window.currentlyPlaying = false;

        // Restore original label of the segment that just ended
        try {
          const btns = document.querySelectorAll(".segment-button");
          const endBtn = (btns && btns.length) ? btns[index] : null;
          if (endBtn && endBtn.dataset && endBtn.dataset.originalLabel) {
            endBtn.textContent = endBtn.dataset.originalLabel;
          }
        } catch (e) {
          // ignore UI restore errors
        }

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
    const loopFile = `lyrics/${selectedTamilName}.json`;

    console.log("📁 Trying to fetch loop file:", loopFile);

    fetch(loopFile)
      .then((response) => {
        if (!response.ok) throw new Error(`Loop file not found: ${loopFile}`);
        return response.json();
      })
      .then((loopData) => {
        console.log("✅ Loop data loaded:", loopData);

        // ⭐ JSON FIX — use tamilSegments array
        window.segments = loopData.tamilSegments || [];

        // ⭐ CRITICAL FIX — the missing assignments
        window.loadedSegments = window.segments;
        window.currentSegments = window.segments;
        console.log("🎯 loopPlayer.js: Segments bridged →", window.segments.length, "segments loaded.");



        
/* -----------------------
   BUTTON CREATION (NEW)
   - each button stores its own data-start / data-end
   - preserves original label in data-original-label
   - independent for goldenIndicator.js or any other script
   ----------------------- */
loopButtonsDiv.innerHTML = "";

(window.segments || []).forEach((segment, index) => {
  const btn = document.createElement("button");
  btn.className = "segment-button";
//btn.textContent = `Segment ${index + 1}`;


// ⭐ ADD STOP ICON HERE ⭐
  const stopIcon = document.createElement("span");
  stopIcon.textContent = "■";                 // stop icon
  stopIcon.className = "segment-stop-icon";   // CSS class

  stopIcon.addEventListener("click", (e) => {
    e.stopPropagation();      // prevent normal play
    setStopAtSegment(index);  // activate stop-at-end
  });

  btn.appendChild(stopIcon);
  // ⭐ END STOP ICON BLOCK ⭐





// ---- PREVIEW TEXT (Tamil-safe) ----
let preview = "";

try {
    if (segment.lyrics && segment.lyrics.length > 0) {
        let line = (segment.lyrics[0] || "").trim();

        // Normalize all space types (Tamil + English)
        line = line.replace(/\s+/gu, " ");

        // Split on ANY kind of whitespace
        let words = line.split(/\s+/u);

        preview = words.slice(0, 3).join(" ");
        if (words.length > 3) preview += "…";
    }
} catch (e) {
    console.warn("Preview error:", e);
    preview = "";
}

btn.textContent = preview
    ? `S${index + 1} — ${preview}`
    : `S${index + 1}`;





  // ✳️ Independent data for other scripts (goldenIndicator.js)
  //    These attributes let other files read times straight from DOM
  btn.dataset.start = (typeof segment.start === "number") ? String(segment.start) : "";
  btn.dataset.end   = (typeof segment.end   === "number") ? String(segment.end)   : "";

  // store original label (safe)
  btn.dataset.originalLabel = btn.textContent.trim();

  btn.addEventListener("click", () => {
    // Reset all button labels when user switches segment
    try {
      document.querySelectorAll(".segment-button").forEach(b => {
        if (b.dataset && b.dataset.originalLabel) {
          b.textContent = b.dataset.originalLabel;
        }
      });
    } catch (e) {
      // ignore
    }

    const isReady =
      window.vocalAudio?.readyState >= 2 &&
      window.accompAudio?.readyState >= 2;

    if (!isReady) {
      console.warn("⏳ Audio not ready yet, using segment-ready helper...");
      checkReadyAndPlaySegment(segment.start, segment.end, index);
    } else {
      playSegment(segment.start, segment.end, index);
    }
  });

  loopButtonsDiv.appendChild(btn);
});



/* ⭐ FINAL — Run Golden Indicator AFTER buttons are created (reliable) */
setTimeout(() => {
    try {
        const c = document.getElementById("loopButtonsContainer");

        // remove any leftover bars to avoid duplication
        c.querySelectorAll(".gold-bar").forEach(e => e.remove());

        if (typeof window.startGoldenIndicator === "function" &&
            window.segments && window.vocalAudio) {

            console.log("GoldenIndicator: Attached AFTER button rebuild");
            window.startGoldenIndicator(window.segments, window.vocalAudio, c);
        }
    } catch (e) {
        console.warn("GoldenIndicator restart error:", e);
    }
}, 300);








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




/*
While Priming takes place a that time current playing
segment suffers. May be due to rule only one segment at a
time. If so relax the rule only for this priming condition.
Let the priming also take place during that priming time
let the playing present segment play smoothly till end
*/
/* ==========================================================
   🔥 Non-invasive priming overlay (2s before boundary)
   - Creates separate, muted Audio "warmers" for next segment
   - Never seeks/touches the currently playing elements
   - Segment 1 start remains untouched
   - Paste at END of loopPlayer.js
   ========================================================== */
(function () {
  if (window.__NONINVASIVE_PRIME_OVERLAY__) return;
  window.__NONINVASIVE_PRIME_OVERLAY__ = true;

  var basePlay = window.playSegment;
  if (typeof basePlay !== "function") return;

  // Tunables
  var LOOKAHEAD_S = 0.35;   // when to prime before boundary
  var WARM_MS     = 120;   // how long to "play" the warmers (muted)
  var TICK_MS     = 40;    // watcher cadence
  var SEEK_NUDGE  = 0.001; // avoid exact-edge rounding

  function once(el, ev){
    return new Promise(res => el.addEventListener(ev, res, { once: true }));
  }

  // Create two muted warmers at a given time; auto-clean after WARM_MS
  async function warmNextAtTime(vocalSrc, accompSrc, t, runId){
    // guard: if a newer run took over, skip
    if (runId !== window.playRunId) return;

    // build warmers
    var v = new Audio(vocalSrc);
    var a = new Audio(accompSrc);
    // keep references to avoid GC
    if (!window.__prime2sWarmers) window.__prime2sWarmers = [];
    window.__prime2sWarmers.push(v, a);

    // common props
    [v, a].forEach(el => {
      try { el.muted = true; } catch(_) {}
      try { el.preload = "auto"; } catch(_) {}
      try { el.playsInline = true; } catch(_) {}
      try { el.crossOrigin = (window.vocalAudio && window.vocalAudio.crossOrigin) || (window.accompAudio && window.accompAudio.crossOrigin) || null; } catch(_) {}
      // append to DOM (some browsers are happier if attached)
      try { (document.body || document.documentElement).appendChild(el); } catch(_) {}
    });

    // load & seek both near next.start
    try {
      // Ensure metadata so we can seek
      await Promise.all([
        (v.readyState >= 1 ? Promise.resolve() : once(v, "loadedmetadata")),
        (a.readyState >= 1 ? Promise.resolve() : once(a, "loadedmetadata"))
      ]);
      v.currentTime = Math.max(0, t + SEEK_NUDGE);
      a.currentTime = Math.max(0, t + SEEK_NUDGE);

      await Promise.all([
        (v.readyState >= 2 ? Promise.resolve() : once(v, "seeked")),
        (a.readyState >= 2 ? Promise.resolve() : once(a, "seeked"))
      ]);

      // muted play to warm up decoders/buffers
      await Promise.allSettled([ v.play(), a.play() ]);

      // let them run a tiny bit, then pause & cleanup
      setTimeout(function(){
        try { v.pause(); } catch(_) {}
        try { a.pause(); } catch(_) {}
        try { v.remove(); } catch(_) {}
        try { a.remove(); } catch(_) {}
        if (window.__prime2sWarmers) {
          window.__prime2sWarmers = window.__prime2sWarmers.filter(x => x !== v && x !== a);
        }
      }, WARM_MS);
    } catch(_) {
      // Best-effort cleanup on any failure
      try { v.remove(); } catch(_) {}
      try { a.remove(); } catch(_) {}
    }
  }

  // Cleanup any lingering warmers (called on takeover)
  function killWarmers(){
    if (!window.__prime2sWarmers) return;
    window.__prime2sWarmers.forEach(el => {
      try { el.pause(); } catch(_) {}
      try { el.remove(); } catch(_) {}
    });
    window.__prime2sWarmers = [];
  }

  window.playSegment = function (startTime, endTime, index) {
    // Run your existing implementation
    basePlay.call(this, startTime, endTime, index);

    var aMain = window.vocalAudio, bMain = window.accompAudio;
    if (!aMain || !bMain) return;

    // Stop previous watcher & warmers (if any)
    if (window.__prime2sStop) { try { window.__prime2sStop(); } catch(_) {} }
    killWarmers();

    var myRun     = window.playRunId;
    var curIdx    = (index|0);
    var curEnd    = endTime;
    var primedFor = -1; // ensure one-time per segment

    var timer = setInterval(function(){
      // Abort if takeover or players gone
      if (myRun !== window.playRunId || !window.vocalAudio || !window.accompAudio) {
        clearInterval(timer); window.__prime2sStop = null; killWarmers(); return;
      }

      // Time to boundary using the live vocal clock (but DO NOT touch it)
      var now = aMain.currentTime;
      var dt  = curEnd - now;

      // Identify the next segment
      var next = (Array.isArray(window.segments) && curIdx < window.segments.length - 1)
        ? window.segments[curIdx + 1]
        : null;

      // Prime exactly once per segment when within the 2s window
      if (next && typeof next.start === "number" &&
          dt > 0 && dt <= LOOKAHEAD_S &&
          primedFor !== curIdx) {

        primedFor = curIdx;

        // Use currentSrc if available (resolves <source> selection)
        var vocalSrc  = aMain.currentSrc || aMain.src;
        var accompSrc = bMain.currentSrc || bMain.src;

        // Fire-and-forget warmers; they won't disturb main playback
        warmNextAtTime(vocalSrc, accompSrc, next.start, myRun);
      }

      // If we cross boundary without a takeover (very unlikely), stop
      if (dt <= 0) {
        clearInterval(timer); window.__prime2sStop = null; killWarmers(); return;
      }
    }, TICK_MS);

    window.__prime2sStop = function(){
      clearInterval(timer);
      killWarmers();
    };
  };

  console.log("✅ Non-invasive 2s priming overlay installed (separate muted warmers).");


 })();


 function setStopAtSegment(index) {
  window.stopAtSegmentIndex = index;

  // Remove active state from all icons
  document.querySelectorAll(".segment-stop-icon").forEach((icon) => {
    icon.classList.remove("active");
  });

  // Highlight the chosen one
  const btn = document.querySelectorAll(".segment-button")[index];
  if (btn) {
    const icon = btn.querySelector(".segment-stop-icon");
    if (icon) icon.classList.add("active");
  }

  console.log("Stop-at-end enabled for segment:", index + 1);
}
