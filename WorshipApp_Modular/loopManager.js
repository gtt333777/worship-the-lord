// WorshipApp_Modular/loopManager.js

let loopSegments = [];
let currentLoopIndex = -1;
let loopBarContainer;

function loadLoopsForSong(songName) {
  const loopsFile = `lyrics/${songName}_loops.json`;
  loopSegments = [];
  currentLoopIndex = -1;

  fetch(loopsFile)
    .then(response => {
      if (!response.ok) throw new Error('Loop file not found');
      return response.json();
    })
    .then(data => {
      loopSegments = data;
      renderLoopButtons();
      console.log("🔁 Loaded loops:", loopSegments);
    })
    .catch(err => {
      console.warn("⚠️ No loops found for this song.");
      clearLoopButtons();
    });
}

function renderLoopButtons() {
  clearLoopButtons();

  loopBarContainer = document.getElementById("loop-bar");
  if (!loopBarContainer) {
    loopBarContainer = document.createElement("div");
    loopBarContainer.id = "loop-bar";
    loopBarContainer.style.display = "flex";
    loopBarContainer.style.flexWrap = "nowrap";
    loopBarContainer.style.overflowX = "auto";
    loopBarContainer.style.padding = "10px";
    loopBarContainer.style.gap = "6px";
    loopBarContainer.style.marginBottom = "8px";
    loopBarContainer.style.justifyContent = "center";
    document.body.insertBefore(loopBarContainer, document.getElementById("lyricsArea"));
  }

  loopSegments.forEach((seg, index) => {
    const btn = document.createElement("button");
    btn.innerText = `🔁 ${index + 1}`;
    btn.style.padding = "10px";
    btn.style.borderRadius = "12px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.minWidth = "60px";
    btn.style.fontWeight = "bold";
    btn.style.background = "#ffda77"; // pleasing yellow-orange
    btn.style.color = "#333";
    btn.onclick = () => playFromLoop(index);
    loopBarContainer.appendChild(btn);
  });
}

function clearLoopButtons() {
  const existing = document.getElementById("loop-bar");
  if (existing) existing.remove();
}

function playFromLoop(index) {
  if (!loopSegments[index]) return;

  currentLoopIndex = index;
  const startTime = loopSegments[index].start;
  const vocal = document.getElementById("vocalAudio");
  const accomp = document.getElementById("accompAudio");

  if (!vocal.src || !accomp.src) {
    console.warn("⚠️ Audio sources not loaded. Please press Play once first.");
    return;
}

vocal.currentTime = startTime;
accomp.currentTime = startTime;

vocal.play();
accomp.play();

  console.log(`▶️ Playing from loop ${index + 1} | Start: ${startTime}s`);
  monitorLoopPlayback();
}

function monitorLoopPlayback() {
  if (currentLoopIndex === -1 || !loopSegments[currentLoopIndex]) return;

  const vocal = document.getElementById("vocalAudio");

  const checkPosition = () => {
    if (currentLoopIndex === -1) return;

    const endTime = loopSegments[currentLoopIndex].end;
    if (vocal.currentTime >= endTime) {
      currentLoopIndex++;
      if (loopSegments[currentLoopIndex]) {
        console.log(`⏭️ Next loop: ${currentLoopIndex + 1}`);
        playFromLoop(currentLoopIndex);
      } else {
        console.log("⏹️ All loops finished.");
        stopPlayback();
      }
    } else {
      requestAnimationFrame(checkPosition);
    }
  };

  requestAnimationFrame(checkPosition);
}

function stopPlayback() {
  const vocal = document.getElementById("vocalAudio");
  const accomp = document.getElementById("accompAudio");
  vocal.pause();
  accomp.pause();
}

// 🔁 Ensure this function is called after song is selected:
function onSongSelectionChange(songName) {
  loadLoopsForSong(songName);
}
