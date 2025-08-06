// loopPlayer.js

console.log("loopPlayer.js: Starting...");

let segmentTimeout;
let currentlyPlaying = false;

function checkReady(attempt = 1) {
  const vocal = window.vocalAudio;
  const accomp = window.accompAudio;
  const dropdown = document.getElementById("songSelect");

  if (!vocal || !accomp || !dropdown) {
    if (attempt > 20) {
      console.error("loopPlayer.js: Required elements not found after multiple attempts");
      return;
    }
    console.log(`loopPlayer.js: Waiting for vocalAudio, accompAudio or dropdown... (attempt ${attempt})`);
    setTimeout(() => checkReady(attempt + 1), 300);
    return;
  }

  const tamilName = dropdown.value;
  const loopFile = `lyrics/${tamilName}_loops.json`;
  console.log("loopPlayer.js: Trying to fetch loop file:", loopFile);

  fetch(loopFile)
    .then(res => {
      if (!res.ok) throw new Error("Loop file not found");
      return res.json();
    })
    .then(data => {
      console.log("✅ loopPlayer.js: Loop data loaded:", data);
      createSegmentButtons(data);
    })
    .catch(err => {
      console.warn("loopPlayer.js: No loop file found or failed to load:", err);
    });
}

document.addEventListener("DOMContentLoaded", checkReady);

function createSegmentButtons(segments) {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = "";
  segments.forEach((seg, i) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${i + 1}`;
    btn.className = "segmentButton";
    btn.dataset.index = i;
    btn.style.position = "relative";
    btn.addEventListener("click", () => playFromSegment(i, segments));

    const progress = document.createElement("div");
    progress.className = "segmentProgress";
    progress.style.position = "absolute";
    progress.style.top = 0;
    progress.style.left = 0;
    progress.style.width = "0%";
    progress.style.height = "100%";
    progress.style.background = "rgba(0, 128, 255, 0.5)";
    progress.style.zIndex = 0;
    progress.style.transition = "width linear";

    btn.appendChild(progress);
    container.appendChild(btn);
  });
}

function playFromSegment(index, segments) {
  const vocal = window.vocalAudio;
  const accomp = window.accompAudio;
  if (!vocal || !accomp) return;

  if (segmentTimeout) {
    clearTimeout(segmentTimeout);
    console.log("🧹 Cleared previous loop timeout");
  }

  vocal.pause();
  accomp.pause();
  currentlyPlaying = false;

  const segment = segments[index];
  const duration = segment.end - segment.start;
  console.log(`▶️ Segment ${index + 1}: ${segment.start} ▶ ${segment.end} (${duration}s)`);

  vocal.currentTime = segment.start;
  accomp.currentTime = segment.start;

  vocal.play();
  accomp.play();
  currentlyPlaying = true;

  updateProgressBar(index, duration);

  segmentTimeout = setTimeout(() => {
    vocal.pause();
    accomp.pause();
    currentlyPlaying = false;
    console.log("⏹️ Segment complete");
  }, duration * 1000);
}

function updateProgressBar(activeIndex, duration) {
  const allButtons = document.querySelectorAll(".segmentButton");
  allButtons.forEach((btn, i) => {
    const bar = btn.querySelector(".segmentProgress");
    if (i === activeIndex) {
      bar.style.transition = `width ${duration}s linear`;
      bar.style.width = "100%";
    } else {
      bar.style.transition = "none";
      bar.style.width = "0%";
    }
  });
}
