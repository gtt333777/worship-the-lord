// WorshipApp_Modular/loopManager.js

let loops = [];
let currentLoopIndex = 0;
let loopMonitor = null;

// Called on song change — loads loop JSON and displays buttons
function onSongSelectionChange(songName) {
  const loopsPath = `lyrics/${songName}_loops.json`;

  fetch(loopsPath)
    .then((res) => res.json())
    .then((data) => {
      loops = data;
      currentLoopIndex = 0;
      console.log("✅ Loaded loops:", loops);
    })
    .catch((err) => {
      loops = [];
      console.warn("⚠️ No loop file found for this song.");
    });
}

// Called when segment button is pressed
function playFromLoop(index) {
  if (!loops[index]) return;

  stopLoopPlayback(); // cancel any old loop logic

  currentLoopIndex = index;

  const vocal = document.getElementById("vocalAudio");
  const accomp = document.getElementById("accompAudio");

  if (!vocal || !accomp || !vocal.src || !accomp.src) {
    console.warn("⚠️ Audio sources not ready.");
    return;
  }

  const { start } = loops[currentLoopIndex];
  vocal.currentTime = start;
  accomp.currentTime = start;

  vocal.play();
  accomp.play();

  console.log(`▶️ Playing from loop ${index + 1}: Start at ${start}s`);
  monitorLoopPlayback();
}

function monitorLoopPlayback() {
  stopLoopPlayback(); // clear any existing monitoring

  const vocal = document.getElementById("vocalAudio");
  const accomp = document.getElementById("accompAudio");

  loopMonitor = setInterval(() => {
    if (!vocal || !accomp || !loops[currentLoopIndex]) return;

    const { end } = loops[currentLoopIndex];
    if (vocal.currentTime >= end || accomp.currentTime >= end) {
      currentLoopIndex++;
      if (loops[currentLoopIndex]) {
        const nextStart = loops[currentLoopIndex].start;
        console.log(`⏭️ Moving to loop ${currentLoopIndex + 1}: ${nextStart}s`);
        vocal.currentTime = nextStart;
        accomp.currentTime = nextStart;
        vocal.play();
        accomp.play();
      } else {
        console.log("⏹️ All loops complete. Stopping.");
        vocal.pause();
        accomp.pause();
        stopLoopPlayback();
      }
    }
  }, 150);
}

function stopLoopPlayback() {
  if (loopMonitor) {
    clearInterval(loopMonitor);
    loopMonitor = null;
  }
}

// Optional: link Pause button
document.getElementById("pauseBtn").addEventListener("click", stopLoopPlayback);

// Link segment buttons by ID
window.addEventListener("DOMContentLoaded", () => {
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(`loopBtn${i}`);
    if (btn) {
      btn.addEventListener("click", () => playFromLoop(i - 1));
    }
  }
});
