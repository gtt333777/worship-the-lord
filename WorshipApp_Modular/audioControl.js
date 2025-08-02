window.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playButton");
  const pauseBtn = document.getElementById("pauseButton");

  const vocalAudio = new Audio();
  const accompAudio = new Audio();
  vocalAudio.crossOrigin = "anonymous";
  accompAudio.crossOrigin = "anonymous";

  function playBoth() {
    vocalAudio.play();
    accompAudio.play();
  }

  function pauseBoth() {
    vocalAudio.pause();
    accompAudio.pause();
  }

  if (playBtn) {
    playBtn.addEventListener("click", playBoth);
  } else {
    console.warn("⚠️ playButton not found in audioControl");
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", pauseBoth);
  } else {
    console.warn("⚠️ pauseButton not found in audioControl");
  }

  // Attach audio objects to window for global access if needed
  window.vocalAudio = vocalAudio;
  window.accompAudio = accompAudio;
});
