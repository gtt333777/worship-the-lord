console.log("audioControl.js: Starting...");

let vocalAudio, accompAudio;

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");
  waitForAudioElements();
});

function waitForAudioElements(retries = 0) {
  vocalAudio = document.getElementById("vocalAudio");
  accompAudio = document.getElementById("accompAudio");

  if (vocalAudio && accompAudio) {
    console.log("audioControl.js: ✅ Audio elements found");
    setupVolumeControls();
  } else {
    if (retries > 20) {
      console.error("audioControl.js: ❌ Audio elements not found after 20 retries");
      return;
    }
    console.log("audioControl.js: Waiting for audio elements...");
    setTimeout(() => waitForAudioElements(retries + 1), 300);
  }
}

function setupVolumeControls() {
  const vocalSlider = document.getElementById("vocalVolume");
  const accompSlider = document.getElementById("accompVolume");
  const playButton = document.getElementById("playButton");

  if (!vocalSlider || !accompSlider || !playButton) {
    console.warn("audioControl.js: Volume controls not ready, retrying...");
    return setTimeout(setupVolumeControls, 300);
  }

  vocalSlider.addEventListener("input", () => {
    vocalAudio.volume = vocalSlider.value;
  });
  accompSlider.addEventListener("input", () => {
    accompAudio.volume = accompSlider.value;
  });

  playButton.addEventListener("click", () => {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
    vocalAudio.play();
    accompAudio.play();
  });

  console.log("audioControl.js: ✅ Volume and play controls wired");
}

// Called by songLoader.js after blobs are fetched
function prepareAudioFromDropbox(vocalBlob, accompBlob) {
  console.log("🎼 prepareAudioFromDropbox: called");

  if (!vocalBlob || !accompBlob) {
    console.error("❌ Missing audio blobs");
    return;
  }

  waitForAudioElementsToAssign(vocalBlob, accompBlob);
}

function waitForAudioElementsToAssign(vocalBlob, accompBlob, retries = 0) {
  vocalAudio = document.getElementById("vocalAudio");
  accompAudio = document.getElementById("accompAudio");

  if (!vocalAudio || !accompAudio) {
    if (retries > 20) {
      console.error("❌ Still no audio elements after 20 retries");
      return;
    }
    setTimeout(() => waitForAudioElementsToAssign(vocalBlob, accompBlob, retries + 1), 300);
    return;
  }

  const vocalURL = URL.createObjectURL(vocalBlob);
  const accompURL = URL.createObjectURL(accompBlob);

  vocalAudio.src = vocalURL;
  accompAudio.src = accompURL;

  console.log("✅ Vocal audio ready");
  console.log("✅ Accompaniment audio ready");
}
