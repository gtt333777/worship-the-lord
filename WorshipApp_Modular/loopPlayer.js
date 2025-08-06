console.log("🔁 loopPlayer.js: Starting...");

let vocalAudio, accompAudio;
let segmentTimeout = null;
let currentlyPlaying = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("loopPlayer.js: DOMContentLoaded — using hardcoded song name for test");

  // Get selected song from dropdown
  const dropdown = document.getElementById("songSelect");
  if (!dropdown) {
    console.warn("loopPlayer.js: No song selected in dropdown.");
    return;
  }

  const selectedSong = dropdown.value.trim();
  if (!selectedSong) {
    console.warn("loopPlayer.js: Empty selection from dropdown.");
    return;
  }

  const loopFileName = "lyrics/" + selectedSong + "_loops.json";
  console.log("🔍 Trying to fetch loop file:", loopFileName);

  fetch(loopFileName)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Loop file not found.");
      }
      return res.json();
    })
    .then((data) => {
      console.log("✅ Loop data loaded:", data);
      createSegmentButtons(data);
    })
    .catch((err) => {
      console.warn("⚠️ loopPlayer.js: No loop file found for this song.");
    });
});

function createSegmentButtons(data) {
  const container = document.getElementById("loopButtonsContainer");
  if (!container) {
    console.warn("⚠️ loopButtonsContainer not found.");
    return;
  }

  container.innerHTML = ""; // clear previous

  data.forEach((seg, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${index + 1}`;
    btn.addEventListener("click", () => {
      playLoopFromIndex(data, index);
    });
    container.appendChild(btn);
  });
}

function playLoopFromIndex(data, startIndex) {
  if (!vocalAudio || !accompAudio) {
    console.warn("🔁 Audio elements not ready.");
    return;
  }

  if (segmentTimeout) {
    clearTimeout(segmentTimeout);
    segmentTimeout = null;
  }

  if (currentlyPlaying) {
    vocalAudio.pause();
    accompAudio.pause();
    currentlyPlaying = false;
  }

  let i = startIndex;

  const playNext = () => {
    if (i >= data.length) {
      console.log("✅ All segments finished.");
      currentlyPlaying = false;
      return;
    }

    const { start, end } = data[i];
    console.log(`🎵 Segment ${i + 1}: ${start} ➡️ ${end}`);

    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    vocalAudio.play().catch((err) => console.error("Vocal play error:", err));
    accompAudio.play().catch((err) => console.error("Acc play error:", err));

    currentlyPlaying = true;

    const duration = (end - start) * 1000;

    segmentTimeout = setTimeout(() => {
      i++;
      playNext();
    }, duration);
  };

  playNext();
}

// Attach pause button logic
document.addEventListener("DOMContentLoaded", () => {
  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (segmentTimeout) {
        clearTimeout(segmentTimeout);
        segmentTimeout = null;
      }

      if (vocalAudio) vocalAudio.pause();
      if (accompAudio) accompAudio.pause();

      currentlyPlaying = false;
      console.log("⏸️ Pause button clicked");
    });
  }

  // Safely wait until audio is globally ready
  let attempts = 0;
  const checkReady = () => {
    vocalAudio = window.vocalAudio;
    accompAudio = window.accompAudio;

    if (!vocalAudio || !accompAudio) {
      if (++attempts < 20) {
        console.log("loopPlayer.js: Waiting for audio elements... (attempt", attempts, ")");
        setTimeout(checkReady, 300);
      } else {
        console.error("loopPlayer.js: ❌ Failed to find audio elements.");
      }
    } else {
      console.log("✅ Audio elements found. loopPlayer.js ready.");
    }
  };
  checkReady();
});
