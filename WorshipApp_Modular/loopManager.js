// === Loop Manager ===
let loops = [];
let activeLoopIndex = 0;
const loopCanvas = document.getElementById("loopCanvas");
const ctx = loopCanvas.getContext("2d");

function drawLoops(duration) {
  ctx.clearRect(0, 0, loopCanvas.width, loopCanvas.height);
  if (!loops.length || !duration) return;
  const width = loopCanvas.width;
  const height = loopCanvas.height;
  const pxPerSec = width / duration;
  loops.forEach((loop, i) => {
    const xStart = loop.start * pxPerSec;
    const xEnd = loop.end * pxPerSec;
    ctx.fillStyle = "#e0b0ff";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.fillStyle = "#333";
    ctx.fillText(i + 1, xStart + 3, 15);
  });
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(vocalAudio.currentTime * pxPerSec, 0);
  ctx.lineTo(vocalAudio.currentTime * pxPerSec, height);
  ctx.stroke();
}

loopCanvas.addEventListener("click", e => {
  if (!vocalAudio.duration || !loops.length) return;
  const rect = loopCanvas.getBoundingClientRect();
  const seconds = (e.clientX - rect.left) * vocalAudio.duration / loopCanvas.width;
  const clickedIndex = loops.findIndex(loop => seconds >= loop.start && seconds <= loop.end);
  if (clickedIndex >= 0) {
    activeLoopIndex = clickedIndex;
    vocalAudio.currentTime = loops[activeLoopIndex].start;
    accompAudio.currentTime = loops[activeLoopIndex].start;
    vocalAudio.play();
    accompAudio.play();
  }
});

vocalAudio.addEventListener("timeupdate", () => {
  drawLoops(vocalAudio.duration);
  if (activeLoopIndex >= 0 && loops.length) {
    const loop = loops[activeLoopIndex];
    if (vocalAudio.currentTime < loop.start) {
      vocalAudio.currentTime = loop.start;
      accompAudio.currentTime = loop.start;
    } else if (vocalAudio.currentTime >= loop.end) {
      activeLoopIndex++;
      if (activeLoopIndex < loops.length) {
        vocalAudio.currentTime = loops[activeLoopIndex].start;
        accompAudio.currentTime = loops[activeLoopIndex].start;
      } else {
        vocalAudio.pause();
        accompAudio.pause();
        activeLoopIndex = -1;
      }
    }
  }
});
