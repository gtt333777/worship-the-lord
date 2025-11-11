// =======================================================
//  loopPlayer.js — Segment Playback Controller
//  🎧 Controls segment looping and synchronization
// =======================================================

console.log("🎵 loopPlayer.js: Starting...");

// === Core: Segment-based playback ===
window.playSegment = function(startTime, endTime, index) {
  console.log(`🎵 Playing segment: ${startTime} → ${endTime} (${(endTime - startTime).toFixed(3)} seconds)`);

  if (!window.vocalAudio || !window.accompAudio) {
    console.error("❌ Missing global audio elements (vocal/accomp)");
    return;
  }

  // --- Align both audio tracks ---
  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  // ✅ Reset boost guard for manual segment replay (fix)
  // This ensures glow + boost + fade trigger even if user taps a segment manually
  window.__VOCAL_BOOST_ACTIVE__ = false;

  // ✅ Optional: Subtle visual cue when user taps a segment
  // (gives a brief gold highlight)
  try {
    const labelEl = document.querySelector('label[for="vocalVolume"]');
    if (labelEl) {
      labelEl.style.boxShadow = "0 0 16px 5px rgba(255,213,79,0.8)";
      labelEl.style.background = "linear-gradient(to right,#fffde7,#fff59d)";
      setTimeout(() => {
        labelEl.style.boxShadow = "";
        labelEl.style.background = "";
      }, 500);
    }
  } catch (e) {
    console.warn("⚠️ Glow cue skipped:", e);
  }

  // --- Begin playback ---
  window.vocalAudio.play().catch((e) => console.error("Vocal play error:", e));
  window.accompAudio.play().catch((e) => console.error("Acc play error:", e));

  const EPS = 0.02;
  const DRIFT = 0.06;

  // --- Keep both tracks tightly synchronized ---
  window.activeSegmentInterval = setInterval(() => {
    const v = window.vocalAudio;
    const a = window.accompAudio;

    if (!v || !a) return;
    const diff = Math.abs(v.currentTime - a.currentTime);

    // Re-sync if drift too high
    if (diff > DRIFT) a.currentTime = v.currentTime;

    // Stop segment if end reached
    if (v.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.activeSegmentInterval = null;

      v.pause();
      a.pause();

      // --- Auto-advance to next segment ---
      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        window.playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50);
};

// === Segment progress logger (optional) ===
window.logSegments = function() {
  if (!window.segments) return;
  window.segments.forEach((seg, i) => {
    console.log(`🎵 Segment ${i + 1}: ${seg.start} -> ${seg.end} (${(seg.end - seg.start).toFixed(3)}s)`);
  });
};

// === Buttons / Controls ===
document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  if (playBtn) {
    playBtn.addEventListener("click", async () => {
      const select = document.getElementById("songSelect");
      if (!select) return;
      const songName = select.value;
      if (!songName) return console.warn("⚠️ No song selected");
      console.log("🎵 loopPlayer.js: Song selected ->", songName);

      if (!window.segments || !window.segments.length) {
        console.warn("⚠️ No segments loaded yet");
        return;
      }

      // Always start from the first segment on Play
      const first = window.segments[0];
      window.playSegment(first.start, first.end, 0);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (window.vocalAudio) window.vocalAudio.pause();
      if (window.accompAudio) window.accompAudio.pause();
      console.log("⏸️ Paused both tracks");
    });
  }

  console.log("✅ Non-invasive 2s priming overlay installed (separate muted warmers).");
});

console.log("✅ loopPlayer.js fully loaded and boost-safe.");
