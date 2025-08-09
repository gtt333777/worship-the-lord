console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;
let currentPlayingSegmentIndex = null;
let stopCheckInterval = null;

/**
 * Wait until an audio element is ready to play.
 */
function waitForAudioReady(audio) {
  return new Promise((resolve) => {
    if (audio.readyState >= 2) {
      resolve();
    } else {
      const check = () => {
        if (audio.readyState >= 2) {
          audio.removeEventListener("canplay", check);
          resolve();
        }
      };
      audio.addEventListener("canplay", check);
    }
  });
}

/**
 * Stop playback cleanly
 */
function stopPlayback() {
  if (stopCheckInterval) {
    clearInterval(stopCheckInterval);
    stopCheckInterval = null;
  }
  vocalAudio.pause();
  accompAudio.pause();
  currentlyPlaying = false;
}

/**
 * Play a segment from startTime to endTime
 */
function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${(endTime - startTime).toFixed(2)} sec)`);

  // Stop any currently playing segment
  stopPlayback();

  // ✅ Ensure both audios are ready before starting
  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    // Sync start position
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;

    // Play together
    vocalAudio.play();
    accompAudio.play();
    currentlyPlaying = true;
    currentPlayingSegmentIndex = index;

    // Check every 50ms whether we reached endTime
    stopCheckInterval = setInterval(() => {
      const vocalDone = vocalAudio.currentTime >= endTime;
      const accompDone = accompAudio.currentTime >= endTime;

      if (vocalDone || accompDone) {
        console.log("🔚 Segment ended.");
        stopPlayback();

        // 🔁 Auto-play next segment, but only when both are ready
        if (index < segments.length - 1) {
          const nextSegment = segments[index + 1];
          Promise.all([
            waitForAudioReady(vocalAudio),
            waitForAudioReady(accompAudio)
          ]).then(() => {
            playSegment(nextSegment.start, nextSegment.end, index + 1);
          });
        }
      }
    }, 50);
  });
}

/**
 * Auto-retry playback if audio not ready
 */
function checkReadyAndPlay(startTime, endTime, index = 0) {
  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    playSegment(startTime, endTime, index);
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
