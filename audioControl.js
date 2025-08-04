console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  setTimeout(() => {
    const vocalSlider = document.getElementById("vocalVolume");
    const accSlider = document.getElementById("accVolume");
    const playButton = document.getElementById("playButton");

    if (!vocalSlider || !accSlider || !playButton) {
      console.warn("audioControl.js: One or more volume controls missing.");
      return;
    }

    vocalSlider.addEventListener("input", () => {
      if (window.vocalAudio) {
        window.vocalAudio.volume = vocalSlider.value;
        console.log("🎤 Vocal volume:", vocalSlider.value);
      }
    });

    accSlider.addEventListener("input", () => {
      if (window.accompAudio) {
        window.accompAudio.volume = accSlider.value;
        console.log("🎹 Accompaniment volume:", accSlider.value);
      }
    });

    playButton.addEventListener("click", () => {
      if (window.vocalAudio && window.accompAudio) {
        window.vocalAudio.currentTime = 0;
        window.accompAudio.currentTime = 0;
        window.vocalAudio.play();
        window.accompAudio.play();
        console.log("▶️ Playing both vocal and accompaniment.");
      } else {
        console.warn("⛔ audioControl.js: Audio not prepared yet.");
      }
    });
  }, 500);
});

function prepareAudioFromDropbox() {
  console.log("🎼 prepareAudioFromDropbox: called");

  const { vocalUrl, accUrl, accessToken, vocalName, accName } = window.currentAudioUrls || {};

  if (!accessToken || !vocalName || !accName) {
    console.error("❌ audioControl.js: Missing token or file names");
    return;
  }

  console.log("🔐 Using access token for Dropbox streaming");

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Dropbox-API-Arg": ""
  };

  const fetchAudioBlob = (filePath, label) => {
    const apiArg = JSON.stringify({ path: `/WorshipSongs/${filePath}` });
    return fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": apiArg
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`${label} fetch failed`);
        return res.blob();
      })
      .then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.preload = "auto";
        audio.volume = 1;
        console.log(`✅ Loaded ${label} audio`);
        return audio;
      });
  };

  Promise.all([
    fetchAudioBlob(vocalName, "vocal"),
    fetchAudioBlob(accName, "accompaniment")
  ])
    .then(([vocal, accompaniment]) => {
      window.vocalAudio = vocal;
      window.accompAudio = accompaniment;
      console.log("🎶 Audio prepared and ready to play.");
    })
    .catch(err => {
      console.error("❌ audioControl.js: Audio fetch failed:", err);
    });
}
