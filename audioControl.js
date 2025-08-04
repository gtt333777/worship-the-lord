console.log("audioControl.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("audioControl.js: DOMContentLoaded fired");

  setTimeout(() => {
    setUpVolumeControls();
  }, 100); // Ensure DOM is fully ready
});

let vocalAudio, accompAudio;

function setUpVolumeControls() {
  const vocalSlider = document.getElementById("vocalVolume");
  const accompSlider = document.getElementById("accompanimentVolume");

  if (!vocalSlider || !accompSlider) {
    console.log("audioControl.js: One or more volume controls missing.");
    return;
  }

  vocalSlider.addEventListener("input", () => {
    if (vocalAudio) vocalAudio.volume = vocalSlider.value;
  });

  accompSlider.addEventListener("input", () => {
    if (accompAudio) accompAudio.volume = accompSlider.value;
  });

  console.log("✅ Volume controls set up");
}

// ✅ Use token-based fetch for Dropbox file with Unicode-safe path
const fetchAudioBlob = async (filePath, label) => {
  const apiUrl = "https://content.dropboxapi.com/2/files/download";

  console.log(`🎧 fetchAudioBlob: Fetching ${label} from ${filePath}`);

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${window.accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path: `/WorshipSongs/${filePath}` })
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
    })
    .catch(err => {
      console.error(`❌ Failed to load ${label}:`, err);
    });
};

async function prepareAudioFromDropbox(vocalName, accName) {
  console.log("🎼 prepareAudioFromDropbox: called");

  if (!window.accessToken) {
    console.error("❌ Missing access token.");
    return;
  }

  console.log("🔐 Using access token for Dropbox streaming");

  try {
    const [vocal, accomp] = await Promise.all([
      fetchAudioBlob(vocalName, "vocal"),
      fetchAudioBlob(accName, "accompaniment")
    ]);

    if (!vocal || !accomp) {
      console.error("❌ One or both audio files failed to load.");
      return;
    }

    vocalAudio = vocal;
    accompAudio = accomp;

    syncPlayback();
  } catch (err) {
    console.error("❌ Error preparing audio:", err);
  }
}

function syncPlayback() {
  const playButton = document.getElementById("playButton");
  if (!playButton) {
    console.error("❌ playButton not found");
    return;
  }

  playButton.onclick = () => {
    if (vocalAudio && accompAudio) {
      accompAudio.currentTime = 0;
      vocalAudio.currentTime = 0;
      accompAudio.play();
      vocalAudio.play();
      console.log("▶️ Playback started");
    } else {
      console.warn("⚠️ Audio not ready yet.");
    }
  };
}
