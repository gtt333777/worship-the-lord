console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;
let activeSegmentTimeout = null;
let currentPlayingSegmentIndex = null;

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
  vocalAudio.pause();
  accompAudio.pause();

  // ✅ Ensure both audios are ready before starting
  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;

    // ✅ Ensure both play exactly together
    Promise.all([
      vocalAudio.play(),
      accompAudio.play()
    ]).then(() => {
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
    }).catch(err => {
      console.warn("⚠️ Audio play error:", err);
    });
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

// ✅ Auto-retry playback if audio not ready
function checkReadyAndPlay(startTime, endTime, index = 0) {
  Promise.all([
    waitForAudioReady(vocalAudio),
    waitForAudioReady(accompAudio)
  ]).then(() => {
    console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;

    // ✅ Ensure both play exactly together
    Promise.all([
      vocalAudio.play(),
      accompAudio.play()
    ]).then(() => {
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
    }).catch(err => {
      console.warn("⚠️ Audio play error:", err);
    });
  });
}
