console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;
let activeSegmentTimeout = null;
let audioLoaded = false; // ✅ To track if Dropbox audio is loaded yet

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio objects not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  // ✅ If audio is not loaded yet, load it first from songLoader.js
  if (!audioLoaded && typeof loadSongFromDropbox === "function") {
    console.log("📥 loopPlayer.js: Loading audio from Dropbox before playing...");
    audioLoaded = true; // prevent duplicate loads
    loadSongFromDropbox(() => {
      // Once loaded, try playing again
      playSegment(startTime, endTime, index);
    });
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
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  // ✅ Play both tracks together
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      currentlyPlaying = true;
      const duration = (endTime - startTime) * 1000;

      activeSegmentTimeout = setTimeout(() => {
        console.log("🔚 Segment ended.");
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;

        // 🔁 Auto-play next segment if available
        if (index < segments.length - 1) {
          const nextSegment = segments[index + 1];
          playSegment(nextSegment.start, nextSegment.end, index + 1);
        }
      }, duration);
    })
    .catch(err => {
      console.warn("⚠️ loopPlayer.js: playSegment Promise.all error:", err);
    });
}

// ✅ Retry logic for not-ready audio
function checkReadyAndPlay(startTime, endTime, index = 0) {
  const isReady = vocalAudio && accompAudio &&
                  vocalAudio.readyState >= 2 &&
                  accompAudio.readyState >= 2;

  if (!isReady) {
    console.warn("⏳ loopPlayer.js: Audio not ready yet...");
    setTimeout(() => checkReadyAndPlay(startTime, endTime, index), 200);
    return;
  }

  playSegment(startTime, endTime, index);
}

// ✅ Setup buttons after song selection
document.addEventListener("DOMContentLoaded", () => {
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");
  const songNameDropdown = document.getElementById("songSelect");

  if (!loopButtonsDiv || !songNameDropdown) {
    console.warn("loopPlayer.js: Missing elements");
    return;
  }

  songNameDropdown.addEventListener("change", () => {
    const selectedTamilName = songNameDropdown.value;
    console.log("🎵 loopPlayer.js: Song selected ->", selectedTamilName);

    const loopFile = `lyrics/${selectedTamilName}_loops.json`;
    console.log("📁 Trying to fetch loop file:", loopFile);

    fetch(loopFile)
      .then(response => {
        if (!response.ok) throw new Error(`Loop file not found: ${loopFile}`);
        return response.json();
      })
      .then(loopData => {
        console.log("✅ Loop data loaded:", loopData);
        segments = loopData;

        // Clear old buttons
        loopButtonsDiv.innerHTML = "";

        // Create new segment buttons
        loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;

          btn.addEventListener("click", () => {
            // Simulate quick taps to avoid sluggishness
            playSegment(segment.start, segment.end, index);
            setTimeout(() => playSegment(segment.start, segment.end, index), 500);
          });

          loopButtonsDiv.appendChild(btn);
        });

        // Start visualizer if available
        if (typeof startSegmentProgressVisualizer === "function") {
          startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsDiv);
        }
      })
      .catch(error => {
        console.warn("❌ loopPlayer.js: Error loading loop file:", error);
      });
  });
});
