// 🔁 LOOP CODE START

let loopSegments = [];
let currentLoopIndex = null;
let loopCheckInterval = null;

function renderLoopButtons() {
  const container = document.getElementById("loopButtonsContainer");
  if (!container) {
    console.warn("⚠️ loopButtonsContainer not found in DOM.");
    return;
  }

  container.innerHTML = ""; // Clear previous

  loopSegments.forEach((loop, index) => {
    const btn = document.createElement("button");
    btn.innerText = `Segment ${index + 1}`;
    btn.className = "loopButton";
    btn.addEventListener("click", () => {
      playLoopSegment(index);
    });
    container.appendChild(btn);
  });
}

function loadLoopsForSong(songPrefix) {
  const dropboxUrl = `https://dl.dropboxusercontent.com/s/${songPrefix}_loops.json`;
  fetch(dropboxUrl)
    .then((res) => res.json())
    .then((data) => {
      loopSegments = data;
      renderLoopButtons();
    })
    .catch((err) => {
      console.warn("⚠️ No loop data found or error loading JSON.");
      loopSegments = [];
      renderLoopButtons();
    });
}

function playLoopSegment(index) {
  if (!loopSegments[index]) return;

  const segment = loopSegments[index];

  if (vocalAudio && accompAudio) {
    // Stop any previous loop
    if (loopCheckInterval) clearInterval(loopCheckInterval);
    vocalAudio.pause();
    accompAudio.pause();

    vocalAudio.currentTime = segment.start;
    accompAudio.currentTime = segment.start;

    vocalAudio.play();
    accompAudio.play();

    currentLoopIndex = index;

    loopCheckInterval = setInterval(() => {
      const now = vocalAudio.currentTime;
      if (now >= segment.end) {
        vocalAudio.pause();
        accompAudio.pause();
        clearInterval(loopCheckInterval);
      }
    }, 100);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("loopButtonsContainer");
  if (!container) {
    console.warn("⚠️ loopButtonsContainer not found on DOMContentLoaded.");
  }
});

// 🔁 LOOP CODE END
