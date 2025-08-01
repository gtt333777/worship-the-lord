// 🔁 LOOP CODE START — loopManager.js

let loops = [];
let currentLoopIndex = 0;
let loopMonitorId = null;

function loadLoops(loadedLoops) {
  loops = loadedLoops;
  currentLoopIndex = 0;
  console.log("✅ Loaded loops:", loops);
  renderLoopButtons();
}

function renderLoopButtons() {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = "";
  loops.forEach((loop, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.className = "loop-btn";
    btn.onclick = () => playFromLoop(i);
    container.appendChild(btn);
  });
}

function stopCurrentLoopMonitor() {
  if (loopMonitorId !== null) {
    cancelAnimationFrame(loopMonitorId);
    loopMonitorId = null;
    console.log("⏹️ Previous loop monitor cancelled.");
  }
}

function playFromLoop(index) {
  if (!loops || !loops[index]) return;

  stopCurrentLoopMonitor(); // ✅ Prevent multiple active loop trackers

  currentLoopIndex = index;
  const { start } = loops[currentLoopIndex];
  const vocal = document.getElementById("vocalAudio");
  const accomp = document.getElementById("accompAudio");

  if (!vocal || !accomp || !vocal.src || !accomp.src) {
    console.warn("⚠️ Audio sources not loaded. Please press Play once first.");
    return;
  }

  vocal.currentTime = start;
  accomp.currentTime = start;
  vocal.play();
  accomp.play();

  console.log(`🎯 Playing from loop ${currentLoopIndex + 1} | Start: ${start}s`);
  monitorLoop();
}

function monitorLoop() {
  const vocal = document.getElementById("vocalAudio");
  const accomp = document.getElementById("accompAudio");
  if (!vocal || !accomp || !loops[currentLoopIndex]) return;

  const { end } = loops[currentLoopIndex];
  const currentTime = vocal.currentTime;

  if (currentTime >= end) {
    currentLoopIndex++;
    if (currentLoopIndex >= loops.length) {
      console.log("✅ Finished final loop. Stopping playback.");
      vocal.pause();
      accomp.pause();
      return;
    }
    const nextStart = loops[currentLoopIndex].start;
    vocal.currentTime = nextStart;
    accomp.currentTime = nextStart;
    console.log(`⏭️ Moving to loop ${currentLoopIndex + 1} | Start: ${nextStart}s`);
  }

  loopMonitorId = requestAnimationFrame(monitorLoop);
}

function pauseLoopPlayback() {
  stopCurrentLoopMonitor();
}

// 🔁 LOOP CODE END
