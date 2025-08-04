console.log("audioControl.js: Loaded");

const vocalAudio = new Audio();
const accompAudio = new Audio();

let vocalVolumeSlider, accompVolumeSlider;
let vocalPlus, vocalMinus, accompPlus, accompMinus;
let playButton;

// Ensure both tracks are synced before playing
function playBothTracks() {
  if (vocalAudio.src && accompAudio.src) {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;

    vocalAudio.play();
    accompAudio.play();
    console.log("▶️ Playing both vocal and accompaniment");
  } else {
    console.warn("⚠️ Audio sources not set yet.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  vocalVolumeSlider = document.getElementById("vocalVolume");
  accompVolumeSlider = document.getElementById("accompVolume");

  vocalPlus = document.getElementById("vocalPlus");
  vocalMinus = document.getElementById("vocalMinus");
  accompPlus = document.getElementById("accompPlus");
  accompMinus = document.getElementById("accompMinus");

  playButton = document.getElementById("playButton");

  if (!vocalVolumeSlider || !accompVolumeSlider || !playButton) {
    console.error("audioControl.js: Missing UI elements.");
    return;
  }

  // Set default volume
  vocalAudio.volume = vocalVolumeSlider.value = 1.0;
  accompAudio.volume = accompVolumeSlider.value = 1.0;

  // Volume slider event listeners
  vocalVolumeSlider.addEventListener("input", () => {
    vocalAudio.volume = vocalVolumeSlider.value;
  });

  accompVolumeSlider.addEventListener("input", () => {
    accompAudio.volume = accompVolumeSlider.value;
  });

  // Fine-tune buttons (1% steps)
  vocalPlus.addEventListener("click", () => {
    adjustVolume(vocalVolumeSlider, vocalAudio, 0.01);
  });
  vocalMinus.addEventListener("click", () => {
    adjustVolume(vocalVolumeSlider, vocalAudio, -0.01);
  });
  accompPlus.addEventListener("click", () => {
    adjustVolume(accompVolumeSlider, accompAudio, 0.01);
  });
  accompMinus.addEventListener("click", () => {
    adjustVolume(accompVolumeSlider, accompAudio, -0.01);
  });

  // Play button
  playButton.addEventListener("click", () => {
    console.log("▶️ Play button clicked");
    console.log("Vocal src:", vocalAudio.src);
    console.log("Accomp src:", accompAudio.src);
    playBothTracks();
  });
});

function adjustVolume(slider, audio, delta) {
  let newVal = parseFloat(slider.value) + delta;
  newVal = Math.max(0, Math.min(1, newVal));
  slider.value = newVal.toFixed(2);
  audio.volume = newVal;
}
