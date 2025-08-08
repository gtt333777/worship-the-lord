console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;
let activeSegmentTimeout = null;
let currentPlayingSegmentIndex = null;

// Volume setter function
function setVolume(type, volume) {
  volume = Math.min(1, Math.max(0, volume)); // clamp between 0 and 1
  if (type === "vocal") {
    vocalAudio.volume = volume;
  } else if (type === "accomp") {
    accompAudio.volume = volume;
  }
}

// Attach volume slider event listeners here (inside loopPlayer.js)
["vocal", "accomp"].forEach(type => {
  const slider = document.getElementById(`${type}Volume`);
  if (!slider) {
    console.warn(`Volume slider for '${type}' not found`);
    return;
  }
  slider.addEventListener("input", e => {
    setVolume(type, parseFloat(e.target.value));
  });
});

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    activeSegmentTimeout = null;
  }
  vocalAudio.pause();
  accompAudio.pause();
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  vocalAudio.play();
  accompAudio.play();
  currentlyPlaying = true;

  const duration = (endTime - startTime) * 1000;

  activeSegmentTimeout = setTimeout(() => {
    console.log("🔚 Segment ended.");
    vocalAudio.pause();
    accompAudio.pause();
    currentlyPlaying = false;

    if (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      playSegment(nextSegment.start, nextSegment.end, index + 1);
    }

  }, duration);
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

// Auto-retry playback if audio not ready
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

  vocalAudio.play();
  accompAudio.play();
  currentlyPlaying = true;

  const duration = (endTime - startTime) * 1000;
  setTimeout(() => {
    console.log("🔚 Segment ended.");
    vocalAudio.pause();
    accompAudio.pause();
    currentlyPlaying = false;

    if (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      playSegment(nextSegment.start, nextSegment.end, index + 1);
    }

  }, duration);
}
