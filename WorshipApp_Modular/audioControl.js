console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  // Retry setup until all elements are found
  const tryInitialize = (retries = 10) => {
    const playButton = document.getElementById("playButton");
    const pauseButton = document.getElementById("pauseButton");
    const vocalSlider = document.getElementById("vocalVolumeSlider");
    const vocalMinus = document.getElementById("vocalMinus");
    const vocalPlus = document.getElementById("vocalPlus");
    const accSlider = document.getElementById("accompanimentVolumeSlider");
    const accMinus = document.getElementById("accompanimentMinus");
    const accPlus = document.getElementById("accompanimentPlus");

    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;

    if (
      playButton &&
      pauseButton &&
      vocalSlider &&
      vocalMinus &&
      vocalPlus &&
      accSlider &&
      accMinus &&
      accPlus &&
      vocalAudio &&
      accompAudio
    ) {
      console.log("audioControl.js: All elements found — initializing...");

      playButton.onclick = () => {
        vocalAudio.play();
        accompAudio.play();
      };

      pauseButton.onclick = () => {
        vocalAudio.pause();
        accompAudio.pause();
      };

      // Vocal Volume Control
      vocalSlider.oninput = () => {
        vocalAudio.volume = vocalSlider.value;
      };
      vocalMinus.onclick = () => {
        vocalSlider.value = Math.max(0, parseFloat(vocalSlider.value) - 0.05).toFixed(2);
        vocalSlider.dispatchEvent(new Event("input"));
      };
      vocalPlus.onclick = () => {
        vocalSlider.value = Math.min(1, parseFloat(vocalSlider.value) + 0.05).toFixed(2);
        vocalSlider.dispatchEvent(new Event("input"));
      };

      // Accompaniment Volume Control
      accSlider.oninput = () => {
        accompAudio.volume = accSlider.value;
      };
      accMinus.onclick = () => {
        accSlider.value = Math.max(0, parseFloat(accSlider.value) - 0.05).toFixed(2);
        accSlider.dispatchEvent(new Event("input"));
      };
      accPlus.onclick = () => {
        accSlider.value = Math.min(1, parseFloat(accSlider.value) + 0.05).toFixed(2);
        accSlider.dispatchEvent(new Event("input"));
      };
    } else {
      if (retries > 0) {
        console.warn("audioControl.js: Waiting for audio buttons to appear...");
        setTimeout(() => tryInitialize(retries - 1), 500);
      } else {
        console.error("audioControl.js: Failed to initialize after retries.");
      }
    }
  };

  tryInitialize();
});
