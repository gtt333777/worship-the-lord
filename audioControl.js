// audioControl.js

document.addEventListener("DOMContentLoaded", () => {
  const playButton = document.getElementById("playButton");
  const vocalSlider = document.getElementById("vocalVolume");
  const accompSlider = document.getElementById("accompVolume");

  const vocalMinus = document.getElementById("vocalMinus");
  const vocalPlus = document.getElementById("vocalPlus");
  const accompMinus = document.getElementById("accompMinus");
  const accompPlus = document.getElementById("accompPlus");

  function playAudio() {
    console.log("▶️ Play button clicked");
    console.log("Vocal src:", window.vocalAudio.src);
    console.log("Accomp src:", window.accompAudio.src);

    if (!window.vocalAudio.src || !window.accompAudio.src) {
      console.warn("⚠️ Audio sources not set yet.");
      return;
    }

    // Reset and sync
    window.vocalAudio.currentTime = 0;
    window.accompAudio.currentTime = 0;
    window.vocalAudio.play();
    window.accompAudio.play();
  }

  function updateVolumes() {
    window.vocalAudio.volume = parseFloat(vocalSlider.value);
    window.accompAudio.volume = parseFloat(accompSlider.value);
  }

  function changeVolume(slider, delta) {
    let val = parseFloat(slider.value);
    val = Math.min(1.0, Math.max(0.0, val + delta));
    slider.value = val.toFixed(2);
    updateVolumes();
  }

  playButton.addEventListener("click", playAudio);

  vocalSlider.addEventListener("input", updateVolumes);
  accompSlider.addEventListener("input", updateVolumes);

  vocalMinus.addEventListener("click", () => changeVolume(vocalSlider, -0.01));
  vocalPlus.addEventListener("click", () => changeVolume(vocalSlider, 0.01));
  accompMinus.addEventListener("click", () => changeVolume(accompSlider, -0.01));
  accompPlus.addEventListener("click", () => changeVolume(accompSlider, 0.01));
});
