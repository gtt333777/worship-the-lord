// 🎚️ audioControl.js: Handles volume sliders and ensures audio globals
document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  const vocalAudio = document.getElementById("vocalAudio");
  const accompAudio = document.getElementById("accompAudio");

  // ✅ Make them available globally for loopPlayer.js
  window.vocalAudio = vocalAudio;
  window.accompAudio = accompAudio;

  const vocalSlider = document.getElementById("vocalVolumeSlider");
  const accompSlider = document.getElementById("accompanimentVolumeSlider");

  function setVolume() {
    if (vocalAudio && vocalSlider) {
      vocalAudio.volume = vocalSlider.value;
    }
    if (accompAudio && accompSlider) {
      accompAudio.volume = accompSlider.value;
    }
  }

  if (vocalSlider) {
    vocalSlider.addEventListener("input", setVolume);
  }

  if (accompSlider) {
    accompSlider.addEventListener("input", setVolume);
  }

  // Fine adjust buttons
  document.getElementById("vocalVolumePlus").onclick = () => {
    vocalSlider.stepUp();
    setVolume();
  };
  document.getElementById("vocalVolumeMinus").onclick = () => {
    vocalSlider.stepDown();
    setVolume();
  };
  document.getElementById("accompanimentVolumePlus").onclick = () => {
    accompSlider.stepUp();
    setVolume();
  };
  document.getElementById("accompanimentVolumeMinus").onclick = () => {
    accompSlider.stepDown();
    setVolume();
  };

  // Wait for audio buttons to be ready
  const interval = setInterval(() => {
    if (!vocalAudio || !accompAudio) {
      console.warn("audioControl.js: Waiting for audio buttons to appear...");
    } else {
      console.log("✅ audioControl.js: Audio elements ready.");
      clearInterval(interval);
    }
  }, 500);
});
