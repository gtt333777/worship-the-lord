console.log("🔁 loopPlayer.js: Ready...");

let activeSegmentTimeout = null;
let currentlyPlaying = false;

document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  if (!songSelect) {
    console.warn("loopPlayer.js: #songSelect not found in DOM.");
    return;
  }

  // Run on initial page load
  const initialSong = songSelect.value;
  if (initialSong) {
    console.log("📦 Initial song detected:", initialSong);
    fetchAndRenderLoopButtons(initialSong);
  }

  // Watch for song selection changes
  songSelect.addEventListener("change", () => {
    const selectedSongName = songSelect.value;
    if (!selectedSongName) {
      console.warn("loopPlayer.js: No song selected in dropdown.");
      return;
    }

    console.log("🎵 loopPlayer.js: Song selected →", selectedSongName);
    fetchAndRenderLoopButtons(selectedSongName);
  });
});

function fetchAndRenderLoopButtons(selectedSongName) {
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");
  if (!loopButtonsDiv) {
    console.warn("loopPlayer.js: loopButtonsContainer not found.");
    return;
  }

  loopButtonsDiv.innerHTML = ""; // Clear old buttons

  const loopFile = `lyrics/${selectedSongName}_loops.json`;
  console.log("📂 Trying to fetch loop file:", loopFile);

  fetch(loopFile)
    .then((response) => {
      if (!response.ok) throw new Error(`Loop file not found: ${loopFile}`);
      return response.json();
    })
    .then((loopData) => {
      console.log("✅ Loop data loaded:", loopData);
      loopData.forEach((segment, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.addEventListener("click", () =>
          playSegment(segment.start, segment.end, index)
        );
        loopButtonsDiv.appendChild(btn);
      });

       // ✅ Notify segmentProgressVisualizer.js
  if (typeof startSegmentProgressVisualizer === "function") {
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");
  startSegmentProgressVisualizer(loopData, vocalAudio, loopButtonsContainer); // ✅ fixed!
}


    })
    .catch((error) => {
      console.warn("❌ loopPlayer.js: Error loading loop file:", error);
    });
}

function playSegment(startTime, endTime, index = 0) {
  console.log(`🎯 Segment: ${startTime} ▶️ ${endTime} (${(endTime - startTime).toFixed(2)}s)`);

  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❗ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, 0);
    return;
  }

  startSegmentPlayback(startTime, endTime);
}

function startSegmentPlayback(start, end) {
  clearTimeout(activeSegmentTimeout);
  currentlyPlaying = true;

  vocalAudio.pause();
  accompAudio.pause();

  vocalAudio.currentTime = start;
  accompAudio.currentTime = start;

  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      console.log("▶️ Both audio tracks started.");
    })
    .catch((err) => {
      console.warn("⚠️ Playback error:", err);
    });

  const duration = (end - start) * 1000;
  activeSegmentTimeout = setTimeout(() => {
    console.log("⏹️ Segment ended.");
    vocalAudio.pause();
    accompAudio.pause();
    currentlyPlaying = false;
  }, duration);
}

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

    // 🔁 Auto-play next segment
    if (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      playSegment(nextSegment.start, nextSegment.end, index + 1);
    }

  }, duration);
}