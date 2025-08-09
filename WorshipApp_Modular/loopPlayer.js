console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;
let activeSegmentTimeout = null;
let syncInterval = null; // 🔄 For per-segment re-sync
let currentPlayingSegmentIndex = null;

/**
 * Wait until an audio element is ready to play (safe, never stuck)
 */
function waitForAudioReady(audio) {
  return new Promise((resolve) => {
    if (audio.readyState >= 2) {
      resolve();
    } else {
      const onReady = () => {
        audio.removeEventListener("canplay", onReady);
        resolve();
      };
      audio.addEventListener("canplay", onReady);
      // Safety fallback
      setTimeout(() => {
        if (audio.readyState >= 2) {
          audio.removeEventListener("canplay", onReady);
          resolve();
        }
      }, 500); // 0.5s
    }
  });
}

/**
 * Keeps the two audio tracks in perfect sync
 */
function ensureSync() {
  if (!vocalAudio || !accompAudio) return;
  const diff = Math.abs(vocalAudio.currentTime - accompAudio.currentTime);
  if (diff > 0.05) { // small tolerance (50ms)
    const avgTime = (vocalAudio.currentTime + accompAudio.currentTime) / 2;
    vocalAudio.currentTime = avgTime;
    accompAudio.currentTime = avgTime;
    console.log(`⚡ Sync corrected: diff=${diff.toFixed(3)}s`);
  }
}

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  // Cancel previous segment
  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    activeSegmentTimeout = null;
  }
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  vocalAudio.pause();
  accompAudio.pause();

  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;

    vocalAudio.play();
    accompAudio.play();
    currentlyPlaying = true;

    // 🔄 Start sync checker every 200ms
    syncInterval = setInterval(ensureSync, 200);

    const duration = (endTime - startTime) * 1000;
    activeSegmentTimeout = setTimeout(() => {
      console.log("🔚 Segment ended.");
      vocalAudio.pause();
      accompAudio.pause();
      currentlyPlaying = false;

      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }

      // 🔁 Auto next segment
      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        playSegment(nextSegment.start, nextSegment.end, index + 1);
      }
    }, duration);
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

        loopButtonsDiv.innerHTML = "";

        loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;
          btn.addEventListener("click", () => {
            playSegment(segment.start, segment.end, index);
          });
          loopButtonsDiv.appendChild(btn);
        });

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

/**
 * Retry playback if audio not ready
 */
function checkReadyAndPlay(startTime, endTime, index = 0) {
  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;

    vocalAudio.play();
    accompAudio.play();
    currentlyPlaying = true;

    // Start sync check
    syncInterval = setInterval(ensureSync, 200);

    const duration = (endTime - startTime) * 1000;
    setTimeout(() => {
      console.log("🔚 Segment ended.");
      vocalAudio.pause();
      accompAudio.pause();
      currentlyPlaying = false;

      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }

      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        playSegment(nextSegment.start, nextSegment.end, index + 1);
      }
    }, duration);
  });
}
