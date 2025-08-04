console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  const checkVolumeControls = setInterval(() => {
    const vocalSlider = document.getElementById("vocalVolume");
    const accSlider = document.getElementById("accVolume");
    const playBtn = document.getElementById("playBtn");

    if (vocalSlider && accSlider && playBtn) {
      clearInterval(checkVolumeControls);
      console.log("audioControl.js: Volume controls found, setting up...");

      setUpVolumeControls(vocalSlider, accSlider);
    } else {
      console.log("audioControl.js: Waiting for volume controls...");
    }
  }, 300);
});

function setUpVolumeControls(vocalSlider, accSlider) {
  console.log("audioControl.js: setUpVolumeControls() initialized");

  window.vocalAudio = new Audio();
  window.accompAudio = new Audio();

  vocalSlider.addEventListener("input", () => {
    vocalAudio.volume = vocalSlider.value;
  });

  accSlider.addEventListener("input", () => {
    accompAudio.volume = accSlider.value;
  });

  const playBtn = document.getElementById("playBtn");
  playBtn.addEventListener("click", () => {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
    vocalAudio.play();
    accompAudio.play();
  });

  vocalSlider.value = 1;
  accSlider.value = 1;
  vocalAudio.volume = 1;
  accompAudio.volume = 1;
}

function prepareAudioFromDropbox() {
  console.log("🎼 prepareAudioFromDropbox: called");

  if (!window.currentAudioUrls) {
    console.warn("⚠️ Token not ready. Deferring audio preparation...");
    return;
  }

  const {
    vocalName,
    accName,
    accessToken
  } = window.currentAudioUrls;

  console.log("🔐 Using access token for Dropbox streaming");

  fetchAudioBlob(vocalName, accessToken)
    .then(blob => {
      vocalAudio.src = URL.createObjectURL(blob);
      console.log("✅ Vocal audio ready");
    })
    .catch(err => {
      console.error("❌ Vocal audio fetch error:", err);
    });

  fetchAudioBlob(accName, accessToken)
    .then(blob => {
      accompAudio.src = URL.createObjectURL(blob);
      console.log("✅ Accompaniment audio ready");
    })
    .catch(err => {
      console.error("❌ Accompaniment audio fetch error:", err);
    });
}

function fetchAudioBlob(fileName, accessToken) {
  const dropboxArg = JSON.stringify({
    path: `/WorshipSongs/${fileName}`
  });

  // Force ASCII-safe header for Dropbox
  const asciiSafeArg = dropboxArg.replace(/[\u007f-\uffff]/g, (c) =>
    "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4)
  );

  return fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Dropbox-API-Arg": asciiSafeArg
    }
  })
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  });
}
