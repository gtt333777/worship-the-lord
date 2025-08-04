console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  setTimeout(() => {
    const playBtn = document.getElementById("playButton");
    const vocalSlider = document.getElementById("vocalVolume");
    const accSlider = document.getElementById("accVolume");

    if (!playBtn || !vocalSlider || !accSlider) {
      console.warn("audioControl.js: One or more volume controls missing.");
      return;
    }

    function setUpVolumeControls() {
      console.log("audioControl.js: setUpVolumeControls running...");

      vocalSlider.addEventListener("input", () => {
        if (window.vocalAudio) vocalAudio.volume = vocalSlider.value;
      });

      accSlider.addEventListener("input", () => {
        if (window.accompAudio) accompAudio.volume = accSlider.value;
      });
    }

    setUpVolumeControls();
  }, 500);
});