// loopManager.js
console.log("loopManager.js: Loaded");

let loopSegments = [];
let currentLoopIndex = 0;
let isLoopPlaying = false;
let userClickedIndex = null;

const vocalAudio = new Audio();
const accAudio = new Audio();

vocalAudio.volume = 1.0;
accAudio.volume = 1.0;

function loadLoopsForSong(songName) {
  const prefix = songName.trim();
  const jsonPath = `lyrics/${encodeURIComponent(prefix)}_loops.json`;
  console.log("📥 loopManager.js: Fetching loop data from", jsonPath);

  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error(`❌ Failed to load loop file: ${jsonPath}`);
      return res.json();
    })
    .then(json => {
      loopSegments = json;
      renderLoopButtons();
    })
    .catch(err => {
      console.error("⚠️ loopManager.js: Could not load loop data:", err);
    });
}

function renderLoopButtons() {
  const container = document.getElementById("loopButtons");
  container.innerHTML = ""; // Clear old

  loopSegments.forEach((seg, i) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${i + 1}`;
    btn.style.padding = "10px";
    btn.style.borderRadius = "10px";
    btn.style.backgroundColor = "#f0a500";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      console.log(`🟢 User clicked Segment ${i + 1}`);
      userClickedIndex = i;
      startPlaybackFromLoop(i);
    };
    container.appendChild(btn);
  });
}

function startPlaybackFromLoop(startIndex) {
  if (isLoopPlaying) {
    stopAudio();
  }

  currentLoopIndex = startIndex;
  isLoopPlaying = true;

  const songName = document.getElementById("songSelect").value.trim();
  const prefix = encodeURIComponent(songName);

  vocalAudio.src = `https://dl.dropboxusercontent.com/scl/fi/yourpath/${prefix}_vocal.mp3?raw=1`;
  accAudio.src = `https://dl.dropboxusercontent.com/scl/fi/yourpath/${prefix}_acc.mp3?raw=1`;

  Promise.all([
    vocalAudio.play().catch(e => console.warn("vocal play error", e)),
    accAudio.play().catch(e => console.warn("acc play error", e))
  ]).then(() => {
    monitorAndAdvanceLoop();
  });
}

function stopAudio() {
  vocalAudio.pause();
  accAudio.pause();
  vocalAudio.currentTime = 0;
  accAudio.currentTime = 0;
}

function monitorAndAdvanceLoop() {
  if (!isLoopPlaying || currentLoopIndex >= loopSegments.length) return;

  const currentLoop = loopSegments[currentLoopIndex];
  vocalAudio.currentTime = currentLoop.start;
  accAudio.currentTime = currentLoop.start;

  const endTime = currentLoop.end;

  const checker = setInterval(() => {
    if (vocalAudio.currentTime >= endTime || vocalAudio.ended) {
      clearInterval(checker);
      currentLoopIndex++;

      if (currentLoopIndex < loopSegments.length) {
        monitorAndAdvanceLoop();
      } else {
        console.log("✅ loopManager.js: All loops completed.");
        stopAudio();
        isLoopPlaying = false;
      }
    }
  }, 200);
}

document.addEventListener("DOMContentLoaded", () => {
  const wait = setInterval(() => {
    const select = document.getElementById("songSelect");
    if (select) {
      clearInterval(wait);
      select.addEventListener("change", () => {
        const selectedSong = select.value;
        loadLoopsForSong(selectedSong);
      });
    } else {
      console.log("⌛ loopManager.js: Waiting for #songSelect...");
    }
  }, 100);
});
