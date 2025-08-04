console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  setupVolumeControls();
});

function setupVolumeControls() {
  const vocalSlider = document.getElementById("vocalVolume");
  const accSlider = document.getElementById("accVolume");

  if (!vocalSlider || !accSlider) {
    console.log("audioControl.js: Waiting for volume controls...");
    setTimeout(setupVolumeControls, 500);
    return;
  }

  vocalSlider.addEventListener("input", () => {
    if (window.vocalAudio) vocalAudio.volume = vocalSlider.value;
  });

  accSlider.addEventListener("input", () => {
    if (window.accompAudio) accompAudio.volume = accSlider.value;
  });

  console.log("✅ Vocal and Accompaniment volume sliders initialized");
}

// 🔁 Playback
document.addEventListener("click", (e) => {
  if (e.target.id === "playBtn") {
    if (window.vocalAudio && window.accompAudio) {
      vocalAudio.currentTime = 0;
      accompAudio.currentTime = 0;
      vocalAudio.play();
      accompAudio.play();
    } else {
      console.warn("⚠️ Audio not ready yet. Please wait...");
    }
  }
});

// 🎧 Prepare audio elements
function prepareAudioFromDropbox(vocalBlob, accBlob) {
  console.log("🎼 prepareAudioFromDropbox: called");

  if (!vocalBlob || !accBlob) {
    console.error("❌ Missing audio blobs in prepareAudioFromDropbox");
    return;
  }

  console.log("🎧 Vocal Blob:", vocalBlob);
  console.log("🎧 Acc Blob:", accBlob);

  const vocalURL = URL.createObjectURL(vocalBlob);
  const accURL = URL.createObjectURL(accBlob);

  window.vocalAudio = new Audio(vocalURL);
  window.accompAudio = new Audio(accURL);

  vocalAudio.volume = document.getElementById("vocalVolume").value;
  accompAudio.volume = document.getElementById("accVolume").value;

  console.log("✅ Vocal audio ready");
  console.log("✅ Accompaniment audio ready");
}
