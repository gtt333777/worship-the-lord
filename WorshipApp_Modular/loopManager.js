// 🔁 LOOP CODE START

let loopSegments = [];
let currentLoopIndex = -1;
let totalDuration = 0;

function renderLoopProgressBar() {
  const container = document.getElementById("loopProgressContainer");
  if (!container) {
    console.warn("⚠️ loopProgressContainer not found in DOM.");
    return;
  }

  container.innerHTML = "";

  loopSegments.forEach((loop, index) => {
    const segment = document.createElement("div");
    segment.className = "loopSegment";
    segment.style.left = `${loop.startPercent}%`;
    segment.style.width = `${loop.widthPercent}%`;
    segment.dataset.index = index;
    segment.innerText = index + 1;

    segment.addEventListener("click", () => {
      playFromLoop(index);
    });

    container.appendChild(segment);
  });
}

function loadLoopsForSong(songPrefix) {
  const url = `https://dl.dropboxusercontent.com/s/${songPrefix}_loops.json`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      loopSegments = data;
      if (vocalAudio?.duration) {
        totalDuration = vocalAudio.duration;
      } else {
        console.warn("⏳ Waiting for audio duration to become available...");
        vocalAudio?.addEventListener("loadedmetadata", () => {
          totalDuration = vocalAudio.duration;
          prepareLoopSegments(data);
        });
        return;
      }
      prepareLoopSegments(data);
    })
    .catch((err) => {
      console.warn("No loop data found for this song.");
      loopSegments = [];
      renderLoopProgressBar();
    });
}

function prepareLoopSegments(data) {
  loopSegments = data.map((seg, i) => ({
    ...seg,
    startPercent: (seg.start / totalDuration) * 100,
    widthPercent: ((seg.end - seg.start) / totalDuration) * 100,
  }));
  renderLoopProgressBar();
}

function playFromLoop(loopIndex) {
  const loop = loopSegments[loopIndex];
  if (!loop || !vocalAudio || !accompAudio) return;

  currentLoopIndex = loopIndex;

  vocalAudio.currentTime = loop.start;
  accompAudio.currentTime = loop.start;

  vocalAudio.play();
  accompAudio.play();

  monitorLoopPlayback();
}

function monitorLoopPlayback() {
  const interval = setInterval(() => {
    const currentTime = vocalAudio.currentTime;
    const loop = loopSegments[currentLoopIndex];
    if (!loop) {
      clearInterval(interval);
      return;
    }

    if (currentTime >= loop.end) {
      const nextIndex = currentLoopIndex + 1;
      if (nextIndex < loopSegments.length) {
        playFromLoop(nextIndex);
      } else {
        vocalAudio.pause();
        accompAudio.pause();
        clearInterval(interval);
      }
    }
  }, 200);
}

// 🛠 Ensure loopProgressContainer presence on load
document.addEventListener("DOMContentLoaded", () => {
  const loopBar = document.getElementById("loopProgressContainer");
  if (!loopBar) {
    console.warn("⚠️ loopProgressContainer not found during DOMContentLoaded.");
  }
});

// 🔁 LOOP CODE END
