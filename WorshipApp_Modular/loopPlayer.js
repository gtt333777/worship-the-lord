console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;
let activeSegmentTimeout = null;
let currentPlayingSegmentIndex = null;

/**
 * Ensures both vocal and accomp audio are ready before playing
 */
function waitForAudioReady(audio) {
  return new Promise((resolve) => {
    if (audio.readyState >= 2) {
      resolve();
    } else {
      const onReady = () => {
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("loadeddata", onReady);
        resolve();
      };
      audio.addEventListener("canplaythrough", onReady);
      audio.addEventListener("loadeddata", onReady);
    }
  });
}

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready.");
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  // Stop any current segment
  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    activeSegmentTimeout = null;
  }
  vocalAudio.pause();
  accompAudio.pause();

  // Jump both tracks to start position
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  // ✅ Wait until both are ready before playing
  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;

    vocalAudio.play();
    accompAudio.play();
    currentlyPlaying = true;
    currentPlayingSegmentIndex = index;

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
  }).catch((err) => {
    console.error("❌ loopPlayer.js: Error during Promise.all:", err);
  });
}

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
