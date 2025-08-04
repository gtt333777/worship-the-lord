console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  setTimeout(() => {
    const vocalSlider = document.getElementById("vocalVolume");
    const accSlider = document.getElementById("accVolume");
    const playBtn = document.getElementById("playButton");

    if (!vocalSlider || !accSlider || !playBtn) {
      console.warn("audioControl.js: One or more volume controls missing.");
      return;
    }

    setUpVolumeControls(vocalSlider, accSlider);
  }, 500);
});

function setUpVolumeControls(vocalSlider, accSlider) {
  const vocalAudio = new Audio();
  const accAudio = new Audio();

  window.vocalAudio = vocalAudio;
  window.accompAudio = accAudio;

  vocalSlider.addEventListener("input", () => {
    vocalAudio.volume = vocalSlider.value;
  });

  accSlider.addEventListener("input", () => {
    accAudio.volume = accSlider.value;
  });

  document.getElementById("playButton").addEventListener("click", () => {
    if (vocalAudio && accAudio) {
      vocalAudio.currentTime = 0;
      accAudio.currentTime = 0;
      vocalAudio.play();
      accAudio.play();
    }
  });
}

function prepareAudioFromDropbox() {
  console.log("🎼 prepareAudioFromDropbox: called");

  const { vocalUrl, accUrl, vocalName, accName, accessToken } = window.currentAudioUrls || {};

  if (!accessToken) {
    console.error("❌ Missing access token.");
    return;
  }

  console.log("🔐 Using access token for Dropbox streaming");

  fetchAudioBlob(vocalUrl, vocalName, accessToken)
    .then(blob => {
      window.vocalAudio.src = URL.createObjectURL(blob);
      console.log("🎤 Vocal audio ready");
    })
    .catch(err => console.error("❌ Vocal audio fetch error:", err));

  fetchAudioBlob(accUrl, accName, accessToken)
    .then(blob => {
      window.accompAudio.src = URL.createObjectURL(blob);
      console.log("🎶 Accompaniment audio ready");
    })
    .catch(err => console.error("❌ Accompaniment audio fetch error:", err));
}

function fetchAudioBlob(url, filename, token) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/WorshipSongs/${filename}`
      }),
    }
  }).then(r => {
    if (!r.ok) throw new Error("Fetch failed with status " + r.status);
    return r.blob();
  });
}
