// audioControl.js

let vocalAudio = null;
let accompAudio = null;

document.addEventListener('DOMContentLoaded', () => {
  const playButton = document.getElementById('playButton');
  const vocalSlider = document.getElementById('vocalVolume');
  const accompSlider = document.getElementById('accompVolume');

  // ✅ Step 1: Check if songLoader.js has already stored audio URLs
  const { vocalUrl, accUrl } = window.currentAudioUrls || {};
  if (vocalUrl && accUrl) {
    console.log("🔗 Linking audioControl to Dropbox URLs...");
    vocalAudio = new Audio(vocalUrl);
    accompAudio = new Audio(accUrl);
    vocalAudio.volume = 1;
    accompAudio.volume = 1;
    setAudioElements(vocalAudio, accompAudio);
  } else {
    console.warn("⚠️ audioControl.js: No audio URLs found in window.currentAudioUrls");
  }

  // ✅ Step 2: Play button logic
  playButton.addEventListener('click', async () => {
    if (vocalAudio && accompAudio) {
      try {
        vocalAudio.currentTime = 0;
        accompAudio.currentTime = 0;

        await Promise.all([
          vocalAudio.play(),
          accompAudio.play()
        ]);
        console.log("▶️ Both audios started in sync.");
      } catch (error) {
        console.error("❌ Playback error:", error);
      }
    } else {
      console.warn("⚠️ Audio elements not initialized.");
    }
  });

  // ✅ Step 3: Volume control via sliders
  vocalSlider.addEventListener('input', () => {
    if (vocalAudio) vocalAudio.volume = vocalSlider.valueAsNumber;
  });
  accompSlider.addEventListener('input', () => {
    if (accompAudio) accompAudio.volume = accompSlider.valueAsNumber;
  });
});

// ✅ Called by songLoader.js if needed
function setAudioElements(vocal, accomp) {
  vocalAudio = vocal;
  accompAudio = accomp;

  document.getElementById('vocalVolume').value = vocal.volume;
  document.getElementById('accompVolume').value = accomp.volume;
}

// ✅ Volume buttons
function adjustVolume(type, change) {
  const slider = document.getElementById(type === 'vocal' ? 'vocalVolume' : 'accompVolume');
  let newVal = Math.min(1, Math.max(0, slider.valueAsNumber + change));
  slider.value = newVal;
  if (type === 'vocal' && vocalAudio) vocalAudio.volume = newVal;
  if (type === 'accomp' && accompAudio) accompAudio.volume = newVal;
}
