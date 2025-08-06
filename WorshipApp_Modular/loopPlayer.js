
console.log("🔁 loopPlayer.js: Ready...");

let activeSegmentTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  if (!songSelect) {
    console.warn("loopPlayer.js: #songSelect not found in DOM.");
    return;
  }

  // Run on initial page load using selected song
  const initialSong = songSelect.value;
  if (initialSong) {
    console.log("📦 Initial song detected:", initialSong);
    fetchAndRenderLoopButtons(initialSong);
  }

  // Also run on song change
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
    console.warn("loopPlayer.js: #loopButtonsContainer not found in DOM.");
    return;
  }

  const loopFilePath = `lyrics/${selectedSongName}_loops.json`;
  console.log("📂 Fetching:", loopFilePath);

  fetch(loopFilePath)
    .then(response => {
      if (!response.ok) throw new Error("Loop JSON not found");
      return response.json();
    })
    .then(data => {
      console.log(`✅ Loaded (${data.length}) segments:`, data);
      loopButtonsDiv.innerHTML = "";
      data.forEach((segment, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.onclick = () => playLoopFromIndex(data, index);
        loopButtonsDiv.appendChild(btn);
      });
    })
    .catch(error => {
      console.error("❌ Failed to load loop JSON:", error.message);
      loopButtonsDiv.innerHTML = "";
    });
}

function playLoopFromIndex(data, startIndex) {
  const vocalAudio = window.vocalAudio;
  const accompAudio = window.accompAudio;

  if (!vocalAudio || !accompAudio) {
    console.error("🔇 Audio elements not ready");
    return;
  }

  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    console.log("⏹️ Cleared previous loop timeout");
  }

  vocalAudio.pause();
  accompAudio.pause();

  const playSegment = (i) => {
    if (i >= data.length) {
      console.log("✅ All segments played.");
      return;
    }

    const segment = data[i];
    const { start, end } = segment;
    const duration = end - start;

    console.log(`▶️ Segment ${i + 1}: ${start} ➡️ ${end} (${duration.toFixed(2)}s)`);

    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    Promise.all([vocalAudio.play(), accompAudio.play()]).catch(err =>
      console.error("❌ Playback error:", err)
    );

    activeSegmentTimeout = setTimeout(() => {
      playSegment(i + 1);
    }, duration * 1000);
  };

  playSegment(startIndex);
}
