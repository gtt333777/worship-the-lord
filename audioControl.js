// audioControl.js

let vocalAudio = new Audio();
let accompAudio = new Audio();

let loopSegments = []; // 🔁 Must be globally accessible
let currentLoopIndex = -1;

// ⏯️ Play from a specific loop segment
function playFromLoopSegment(segmentIndex) {
  console.log(`▶️ playFromLoopSegment: Segment ${segmentIndex + 1} clicked`);

  if (!loopSegments || !loopSegments[segmentIndex]) {
    console.warn("⚠️ No such loop segment found.");
    return;
  }

  const segment = loopSegments[segmentIndex];
  const startTime = segment.start;
  const endTime = segment.end;

  if (isNaN(startTime) || isNaN(endTime)) {
    console.error("⛔ Invalid segment time values.");
    return;
  }

  currentLoopIndex = segmentIndex;

  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  vocalAudio.play();
  accompAudio.play();

  const stopPlayback = () => {
    if (vocalAudio.currentTime >= endTime || accompAudio.currentTime >= endTime) {
      vocalAudio.pause();
      accompAudio.pause();
      vocalAudio.removeEventListener("timeupdate", stopPlayback);
    }
  };

  vocalAudio.addEventListener("timeupdate", stopPlayback);
}

// 🔊 Volume Control
function setVolume(type, value) {
  if (type === "vocal") {
    vocalAudio.volume = Math.max(0, Math.min(1, vocalAudio.volume + value));
  } else if (type === "accompaniment") {
    accompAudio.volume = Math.max(0, Math.min(1, accompAudio.volume + value));
  }
}

// 🎚️ Hook up UI Volume Buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("vocalVolumeMinus").onclick = () => setVolume("vocal", -0.1);
  document.getElementById("vocalVolumePlus").onclick = () => setVolume("vocal", 0.1);
  document.getElementById("accompVolumeMinus").onclick = () => setVolume("accompaniment", -0.1);
  document.getElementById("accompVolumePlus").onclick = () => setVolume("accompaniment", 0.1);

  document.getElementById("playButton").onclick = () => {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
    vocalAudio.play();
    accompAudio.play();
  };
});
