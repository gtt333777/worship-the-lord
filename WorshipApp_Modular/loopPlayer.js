console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  // Cancel any previous segment playback
  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    activeSegmentTimeout = null;
  }

  // Ensure both audios are paused and positioned at the segment start
  vocalAudio.pause();
  accompAudio.pause();
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  // ✅ Ensure both tracks start together and then micro-sync them
  Promise.all([
    vocalAudio.play().catch(err => console.error("❌ Vocal segment play error:", err)),
    accompAudio.play().catch(err => console.error("❌ Accomp segment play error:", err))
  ]).then(() => {
    // Micro-sync: if there's a small drift after both started, nudge one to match the other.
    // This improves phase alignment while keeping changes minimal.
    try {
      const driftThreshold = 0.05; // seconds (50 ms)
      const drift = Math.abs(vocalAudio.currentTime - accompAudio.currentTime);
      if (drift > driftThreshold) {
        // Align accompaniment to vocal (keeps vocal as source of truth).
        // This is a tiny seek; doing it immediately after play reduces long-term drift.
        console.log(`🔧 micro-sync: correcting drift ${drift.toFixed(3)}s -> aligning accomp to vocal`);
        accompAudio.currentTime = vocalAudio.currentTime;
      }
    } catch (err) {
      console.warn("⚠️ loopPlayer.js: micro-sync error:", err);
    }

    currentlyPlaying = true;

    const duration = (endTime - startTime) * 1000;

    activeSegmentTimeout = setTimeout(() => {
      console.log("🔚 Segment ended.");
      vocalAudio.pause();
      accompAudio.pause();
      currentlyPlaying = false;

      // 🔁 Auto-play next segment
      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        playSegment(nextSegment.start, nextSegment.end, index + 1);
      }

    }, duration);
  });
}


let activeSegmentTimeout = null;
let currentPlayingSegmentIndex = null;

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
        segments = loopData;

        // Clear existing buttons
        loopButtonsDiv.innerHTML = "";

        // Create segment buttons
        loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;
          btn.addEventListener("click", () => {
            playSegment(segment.start, segment.end, index);
          });
          loopButtonsDiv.appendChild(btn);
        });

        // ✅ Notify segmentProgressVisualizer.js
        if (typeof startSegmentProgressVisualizer === "function") {
          const loopButtonsContainer = document.getElementById("loopButtonsContainer");
          startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsContainer);
        }

      })
      .catch((error) => {
        console.warn("❌ loopPlayer.js: Error loading loop file:", error);
      });
  });
});

// ✅ Auto-retry playback if audio not ready
function checkReadyAndPlay(startTime, endTime, index = 0) {
  const isReady = vocalAudio.readyState >= 2 && accompAudio.readyState >= 2;

  if (!isReady) {
    console.warn("⏳ loopPlayer.js: Audio not ready yet...");
    setTimeout(() => checkReadyAndPlay(startTime, endTime, index), 200);
    return;
  }

  console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  // ✅ Sync playback like playSegment(), with micro-sync after both start
  Promise.all([
    vocalAudio.play().catch(err => console.error("❌ Vocal segment play error:", err)),
    accompAudio.play().catch(err => console.error("❌ Accomp segment play error:", err))
  ]).then(() => {
    // Micro-sync: small nudge if needed
    try {
      const driftThreshold = 0.05; // seconds (50 ms)
      const drift = Math.abs(vocalAudio.currentTime - accompAudio.currentTime);
      if (drift > driftThreshold) {
        console.log(`🔧 micro-sync (checkReadyAndPlay): correcting drift ${drift.toFixed(3)}s`);
        accompAudio.currentTime = vocalAudio.currentTime;
      }
    } catch (err) {
      console.warn("⚠️ loopPlayer.js: micro-sync error:", err);
    }

    currentlyPlaying = true;

    const duration = (endTime - startTime) * 1000;
    setTimeout(() => {
      console.log("🔚 Segment ended.");
      vocalAudio.pause();
      accompAudio.pause();
      currentlyPlaying = false;

      // 🔁 Auto-play next segment
      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        playSegment(nextSegment.start, nextSegment.end, index + 1);
      }

    }, duration);
  });
}
