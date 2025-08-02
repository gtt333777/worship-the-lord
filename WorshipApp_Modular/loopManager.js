// 🔁 LOOP CODE START

let loopSegments = [];
let currentLoopInterval = null;
let totalDuration = 0; // this must be set by songLoader.js after audio loads

function renderLoopButtons() {
  const container = document.getElementById("loopButtonsContainer");
  if (!container) {
    console.warn("⚠️ loopButtonsContainer not found.");
    return;
  }

  container.innerHTML = "";

  loopSegments.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.textContent = index + 1;
    btn.className = "loop-btn";
    btn.onclick = () => playFromLoop(index);
    container.appendChild(btn);
  });
}

function playFromLoop(loopIndex) {
  const loop = loopSegments[loopIndex];
  if (!loop || !vocalAudio || !accompAudio) return;

  // 🔇 Stop any previous loop
  if (currentLoopInterval !== null) {
    clearInterval(currentLoopInterval);
    currentLoopInterval = null;
    vocalAudio.pause();
    accompAudio.pause();
  }

  // 🎵 Set position and start playback
  vocalAudio.currentTime = loop.start;
  accompAudio.currentTime = loop.start;

  vocalAudio.play();
  accompAudio.play();

  currentLoopInterval = setInterval(() => {
    const currentTime = vocalAudio.currentTime;
    if (currentTime >= loop.end) {
      vocalAudio.pause();
      accompAudio.pause();
      clearInterval(currentLoopInterval);
      currentLoopInterval = null;
    }
  }, 100);
}

function loadLoopsForSong(songPrefix) {
  const url = `https://dl.dropboxusercontent.com/s/${songPrefix}_loops.json`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!totalDuration || totalDuration === 0) {
        console.warn("⏳ totalDuration not ready yet.");
        return;
      }

      loopSegments = data.map((seg) => ({
        ...seg,
        startPercent: (seg.start / totalDuration) * 100,
        widthPercent: ((seg.end - seg.start) / totalDuration) * 100,
      }));

      renderLoopButtons();
    })
    .catch((err) => {
      console.warn("⚠️ No loop data found.");
      loopSegments = [];
      renderLoopButtons();
    });
}

// ⛔ Prevent unwanted full song playback
document.addEventListener("DOMContentLoaded", () => {
  if (vocalAudio && accompAudio) {
    vocalAudio.addEventListener("play", () => {
      if (currentLoopInterval === null) {
        vocalAudio.pause();
        accompAudio.pause();
        console.warn("⛔ Full-song playback is blocked. Use loop buttons.");
      }
    });
  }
});
