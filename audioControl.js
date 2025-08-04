console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  const waitForControls = setInterval(() => {
    const vocalSlider = document.getElementById("vocalVolume");
    const accSlider = document.getElementById("accompanimentVolume");
    const playBtn = document.getElementById("playButton");

    if (vocalSlider && accSlider && playBtn) {
      clearInterval(waitForControls);
      console.log("audioControl.js: All volume controls found, initializing setup...");
      setUpVolumeControls();
    } else {
      console.log("audioControl.js: Waiting for volume controls...");
    }
  }, 300);
});

function setUpVolumeControls() {
  const vocalSlider = document.getElementById("vocalVolume");
  const accSlider = document.getElementById("accompanimentVolume");
  const playBtn = document.getElementById("playButton");

  let vocalAudio = null;
  let accAudio = null;

  window.prepareAudioFromDropbox = function () {
    console.log("🎼 prepareAudioFromDropbox: called");

    const {
      accessToken,
      vocalName,
      accName
    } = window.currentAudioUrls || {};

    if (!accessToken || !vocalName || !accName) {
      console.warn("❗ Token or filenames missing.");
      return;
    }

    console.log("🔐 Using access token for Dropbox streaming");

    // Create headers
    const baseHeaders = (filename) => ({
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path: `/WorshipSongs/${filename}` })
      }
    });

    // Prepare Vocal Audio
    fetch("https://content.dropboxapi.com/2/files/download", baseHeaders(vocalName))
      .then(res => res.blob())
      .then(blob => {
        vocalAudio = new Audio(URL.createObjectURL(blob));
        vocalAudio.volume = vocalSlider.value;
        console.log("✅ Vocal audio ready");
      })
      .catch(err => {
        console.error("❌ Vocal audio fetch error:", err);
      });

    // Prepare Accompaniment Audio
    fetch("https://content.dropboxapi.com/2/files/download", baseHeaders(accName))
      .then(res => res.blob())
      .then(blob => {
        accAudio = new Audio(URL.createObjectURL(blob));
        accAudio.volume = accSlider.value;
        console.log("✅ Accompaniment audio ready");
      })
      .catch(err => {
        console.error("❌ Accompaniment audio fetch error:", err);
      });
  };

  // Volume Controls
  vocalSlider.addEventListener("input", () => {
    if (vocalAudio) vocalAudio.volume = vocalSlider.value;
  });

  accSlider.addEventListener("input", () => {
    if (accAudio) accAudio.volume = accSlider.value;
  });

  // Play Button
  playBtn.addEventListener("click", () => {
    if (!vocalAudio || !accAudio) {
      console.warn("⚠️ Audio not ready yet.");
      return;
    }
    vocalAudio.currentTime = 0;
    accAudio.currentTime = 0;
    vocalAudio.play();
    accAudio.play();
  });
}
