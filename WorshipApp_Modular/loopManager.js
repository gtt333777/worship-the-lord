// 🔁 LOOP CODE START

let loopSegments = [];
let currentLoopIndex = 0;
let isPlayingLoop = false;
let loopPlaybackInterval;

function renderLoopProgressBar() {
  const container = document.getElementById("loopProgressContainer");
  if (!container) {
    console.warn("⚠️ loopProgressContainer not found in DOM.");
    return;
  }

  container.innerHTML = ""; // Clear old loops

  loopSegments.forEach((loop, index) => {
    const segment = document.createElement("div");
    segment.className = "loopSegment";
    segment.style.left = `${loop.startPercent}%`;
    segment.style.width = `${loop.widthPercent}%`;
    segment.dataset.index = index;
    segment.innerText = index + 1;

    segment.addEventListener("click", () => {
      currentLoopIndex = index;
      playCurrentLoop();
    });

    container.appendChild(segment);
  });
}

function loadLoopsForSong(songPrefix, totalDuration) {
  const url = `https://dl.dropboxusercontent.com/s/${songPrefix}_loops.json`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      loopSegments = data.map((seg, i) => ({
        ...seg,
        startPercent: (seg.start / totalDuration) * 100,
        widthPercent: ((seg.end - seg.start) / totalDuration) * 100,
      }));
      currentLoopIndex = 0;
      renderLoopProgressBar();
    })
    .catch((err) => {
      console.warn("No loop data found for this song.");
      loopSegments = [];
      renderLoopProgressBar(); // Clear previous if any
    });
}

function playCurrentLoop() {
  const loop = loopSegments[currentLoopIndex];
  if (!loop || !vocalAudio || !accompAudio) return;

  isPlayingLoop = true;
  vocalAudio.currentTime = loop.start;
  accompAudio.currentTime = loop.start;

  vocalAudio.play();
  accompAudio.play();

  if (loopPlaybackInterval) clearInterval(loopPlaybackInterval);

  loopPlaybackInterval = setInterval(() => {
    const currentTime = vocalAudio.currentTime;
    if (currentTime >= loop.end) {
      currentLoopIndex++;
      if (currentLoopIndex < loopSegments.length) {
        playCurrentLoop();
      } else {
        vocalAudio.pause();
        accompAudio.pause();
        isPlayingLoop = false;
        clearInterval(loopPlaybackInterval);
      }
    }
  }, 200);
}

// 🛠 DOM ready hook
document.addEventListener("DOMContentLoaded", () => {
  const loopBar = document.getElementById("loopProgressContainer");
  if (!loopBar) {
    console.warn("⚠️ loopProgressContainer not found during DOMContentLoaded.");
  }
});
