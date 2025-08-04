console.log("audioControl.js: Starting...");

let vocalAudio, accAudio;
let vocalVolumeSlider, accVolumeSlider;
let playBtn;
let vocalVolume = 1.0;
let accVolume = 1.0;

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");
  setUpVolumeControls();
  waitForPlayButton();
});

function waitForPlayButton() {
  const check = () => {
    playBtn = document.querySelector("#playButton");
    if (playBtn) {
      console.log("audioControl.js: Play button found ✅");
      playBtn.addEventListener("click", handlePlay);
    } else {
      console.log("audioControl.js: Waiting for play button...");
      setTimeout(check, 300);
    }
  };
  check();
}

function handlePlay() {
  console.log("▶️ Play button clicked");

  if (!vocalAudio || !accAudio) {
    console.warn("⚠️ Audio not ready yet. Please wait...");
    return;
  }

  try {
    vocalAudio.currentTime = 0;
    accAudio.currentTime = 0;

    console.log("🎚️ Vocal volume:", vocalAudio.volume);
    console.log("🎚️ Acc volume:", accAudio.volume);

    vocalAudio.play();
    accAudio.play();
    console.log("🔊 Playback started");
  } catch (err) {
    console.error("❌ Error during playback:", err);
  }
}

function setUpVolumeControls() {
  vocalVolumeSlider = document.querySelector("#vocalVolume");
  accVolumeSlider = document.querySelector("#accVolume");

  if (!vocalVolumeSlider || !accVolumeSlider) {
    console.log("audioControl.js: Waiting for volume controls...");
    setTimeout(setUpVolumeControls, 300);
    return;
  }

  console.log("✅ Volume sliders found");

  vocalVolumeSlider.addEventListener("input", () => {
    vocalVolume = parseFloat(vocalVolumeSlider.value);
    if (vocalAudio) vocalAudio.volume = vocalVolume;
  });

  accVolumeSlider.addEventListener("input", () => {
    accVolume = parseFloat(accVolumeSlider.value);
    if (accAudio) accAudio.volume = accVolume;
  });
}

function prepareAudioFromDropbox(vocalBlob, accBlob) {
  console.log("🎼 prepareAudioFromDropbox: called");

  if (!vocalBlob || !accBlob) {
    console.error("❌ Missing audio blobs");
    return;
  }

  const vocalURL = URL.createObjectURL(vocalBlob);
  const accURL = URL.createObjectURL(accBlob);

  vocalAudio = new Audio();
  accAudio = new Audio();

  vocalAudio.src = vocalURL;
  accAudio.src = accURL;

  vocalAudio.volume = vocalVolume;
  accAudio.volume = accVolume;

  vocalAudio.oncanplaythrough = () => {
    console.log("✅ Vocal audio ready");
  };
  accAudio.oncanplaythrough = () => {
    console.log("✅ Accompaniment audio ready");
  };
}

// Expose globally
window.prepareAudioFromDropbox = prepareAudioFromDropbox;
