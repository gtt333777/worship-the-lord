console.log("loopPlayer.js: Starting...");

let segmentTimeout;
let currentlyPlaying = false;
let progressBarInterval;

document.addEventListener("DOMContentLoaded", checkReady);

function checkReady(tries = 0) {
  const songSelect = document.getElementById("songSelect");
  if (songSelect && songSelect.value) {
    console.log("loopPlayer.js: Using selected song name for test");

    const songName = songSelect.value.trim();
    const loopFile = `lyrics/${songName}_loops.json`;
    console.log("Trying to fetch loop file:", loopFile);

    fetch(loopFile)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Loop file not found");
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid loop data");
        }
        createSegmentButtons(data);
      })
      .catch((err) => {
        console.warn("⚠️ No loop file found for this song. Error:", err.message);
      });
  } else {
    if (tries < 20) {
      setTimeout(() => checkReady(tries + 1), 300);
    } else {
      console.warn("loopPlayer.js: Failed to find songSelect after 20 tries.");
    }
  }
}

function createSegmentButtons(segments) {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = "";
  segments.forEach((segment, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${index + 1}`;
    btn.style.marginRight = "10px";
    btn.dataset.start = segment.start;
    btn.dataset.end = segment.end;

    btn.addEventListener("click", () => {
      console.log(`▶️ Segment ${index + 1}: ${segment.start} ➡ ${segment.end}`);
      playSegment(segment.start, segment.end, btn);
    });

    container.appendChild(btn);
  });
}

function playSegment(startTime, endTime, activeBtn) {
  const vocalAudio = document.getElementById("vocalAudio");
  const accompAudio = document.getElementById("accompAudio");

  if (!vocalAudio || !accompAudio) {
    console.warn("Audio elements not ready.");
    return;
  }

  // 🔁 Stop any existing segment
  clearTimeout(segmentTimeout);
  if (progressBarInterval) clearInterval(progressBarInterval);
  removeProgressBars();

  currentlyPlaying = true;

  vocalAudio.pause();
  accompAudio.pause();

  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      const duration = endTime - startTime;
      segmentTimeout = setTimeout(() => {
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;
        removeProgressBars();
        console.log("⏹️ Segment ended");
      }, duration * 1000);

      showProgressBar(activeBtn, duration);
    })
    .catch((err) => {
      console.error("🎵 Playback error:", err);
    });
}

function removeProgressBars() {
  document.querySelectorAll(".progress-bar").forEach((bar) => bar.remove());
}

function showProgressBar(button, duration) {
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  bar.style.position = "absolute";
  bar.style.bottom = "5px";
  bar.style.left = "50%";
  bar.style.transform = "translateX(-50%)";
  bar.style.width = "4px";
  bar.style.height = "0%";
  bar.style.backgroundColor = "#007BFF";
  bar.style.transition = "height linear";
  button.style.position = "relative";
  button.appendChild(bar);

  let startTime = Date.now();
  progressBarInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const percent = Math.min((elapsed / duration) * 100, 100);
    bar.style.height = `${percent}%`;

    if (percent >= 100) {
      clearInterval(progressBarInterval);
    }
  }, 50);
}

// Optional: pause playback if global pause button is used
document.getElementById("pauseBtn")?.addEventListener("click", () => {
  const vocalAudio = document.getElementById("vocalAudio");
  const accompAudio = document.getElementById("accompAudio");
  if (vocalAudio && accompAudio) {
    vocalAudio.pause();
    accompAudio.pause();
    currentlyPlaying = false;
    clearTimeout(segmentTimeout);
    removeProgressBars();
    if (progressBarInterval) clearInterval(progressBarInterval);
    console.log("⏸️ Pause button clicked");
  }
});
