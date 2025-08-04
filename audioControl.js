console.log("audioControl.js: Loaded");

let vocalAudio = null;
let accAudio = null;

document.addEventListener("DOMContentLoaded", () => {
  const playButton = document.getElementById("playButton");
  const vocalVolumeSlider = document.getElementById("vocalVolume");
  const accVolumeSlider = document.getElementById("accVolume");
  const vocalVolUp = document.getElementById("vocalVolUp");
  const vocalVolDown = document.getElementById("vocalVolDown");
  const accVolUp = document.getElementById("accVolUp");
  const accVolDown = document.getElementById("accVolDown");

  // Shared play function
  playButton.addEventListener("click", () => {
    if (vocalAudio && accAudio) {
      vocalAudio.currentTime = 0;
      accAudio.currentTime = 0;
      vocalAudio.play();
      accAudio.play();
    } else {
      console.warn("audioControl.js: Audio not ready.");
    }
  });

  // Volume clamp function
  function clamp(val) {
    return Math.min(1, Math.max(0, val));
  }

  // Volume slider listeners
  vocalVolumeSlider.addEventListener("input", () => {
    if (vocalAudio) vocalAudio.volume = parseFloat(vocalVolumeSlider.value);
  });

  accVolumeSlider.addEventListener("input", () => {
    if (accAudio) accAudio.volume = parseFloat(accVolumeSlider.value);
  });

  // 1% step control
  const STEP = 0.01;

  vocalVolUp.addEventListener("click", () => {
    const newVal = clamp(parseFloat(vocalVolumeSlider.value) + STEP);
    vocalVolumeSlider.value = newVal;
    if (vocalAudio) vocalAudio.volume = newVal;
  });

  vocalVolDown.addEventListener("click", () => {
    const newVal = clamp(parseFloat(vocalVolumeSlider.value) - STEP);
    vocalVolumeSlider.value = newVal;
    if (vocalAudio) vocalAudio.volume = newVal;
  });

  accVolUp.addEventListener("click", () => {
    const newVal = clamp(parseFloat(accVolumeSlider.value) + STEP);
    accVolumeSlider.value = newVal;
    if (accAudio) accAudio.volume = newVal;
  });

  accVolDown.addEventListener("click", () => {
    const newVal = clamp(parseFloat(accVolumeSlider.value) - STEP);
    accVolumeSlider.value = newVal;
    if (accAudio) accAudio.volume = newVal;
  });
});

// 🌟 Called from songLoader.js to set audio references
function setAudioElements(vocalEl, accEl) {
  vocalAudio = vocalEl;
  accAudio = accEl;
  console.log("audioControl.js: Audio elements set");
}
