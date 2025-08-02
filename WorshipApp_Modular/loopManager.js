// 🔁 LOOP CODE START

let loopSegments = [];
let currentLoopIndex = 0;
let loopPlaybackInterval = null;

function renderLoopProgressBar() {
  const container = document.getElementById("loopProgressContainer");
  if (!container) {
    console.warn("⚠️ loopProgressContainer not found in DOM.");
    return;
  }

  container.innerHTML = ""; // Clear previous segments

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
      loopSegments = data.map((seg) => ({
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
      renderLoopProgressBar(); // Clear bar if no data
    });
}

function playFromLoop(loopIndex) {
  const loop = loopSegments[loopIndex];
  if (!loop) return;

  if (vocalAudio && accompAudio) {
    vocalAudio.currentTime = loop.start;
    accompAudio.currentTime = loop.start;

    vocalAudio.play();
    accompAudio.play();

    currentLoopIndex = loopIndex;
    if (loopPlaybackInterval) clearInterval(loopPlaybackInterval);

    loopPlaybackInterval = setInterval(() => {
      const currentTime = vocalAudio.currentTime;
      if (currentTime >= loop.end) {
        const nextLoopIndex = currentLoopIndex + 1;
        if (nextLoopIndex < loopSegments.length) {
          playFromLoop(nextLoopIndex);
        } else {
          vocalAudio.pause();
          accompAudio.pause();
          clearInterval(loopPlaybackInterval);
        }
      }
    }, 200);
  }
}

// ✅ On DOM load, check for loop container
document.addEventListener("DOMContentLoaded", () => {
  const loopBar = document.getElementById("loopProgressContainer");
  if (!loopBar) {
    console.warn("⚠️ loopProgressContainer not found during DOMContentLoaded.");
  }
});
