// WorshipApp_Modular/songLoader.js

let vocalAudio = new Audio();
let accompAudio = new Audio();

async function waitForToken() {
  while (!ACCESS_TOKEN) {
    console.log("⏳ Waiting for Dropbox token...");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log("✅ Dropbox token available for use.");
}

function getDropboxFileURL(path) {
  return fetch("/.netlify/functions/getDropboxToken")
    .then(res => res.json())
    .then(data => {
      const token = data.access_token;
      return fetch("https://content.dropboxapi.com/2/files/download", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({ path })
        }
      }).then(res => res.blob());
    });
}

function getFilenameFromTamilName(tamilName) {
  const songsMap = {
    "இயேசு ரத்தமே நந்தமே நந்தமே": "yesu_raththamae_nandhamae_nandhamae",
    "விலையொ-Freeபெற்று நந்தமே": "vilai_perra_nandhamae",
    "துன்பங்கள் வந்தாலும்": "thunbangal_vandhaalum"
    // Add other Tamil to filename mappings here if needed
  };

  for (const [key, val] of Object.entries(songsMap)) {
    if (tamilName.includes(key)) {
      return val;
    }
  }

  console.warn("❗ No matching filename found. Using fallback slugging.");
  return tamilName.replace(/\s+/g, "_").replace(/[^\w_]/g, "").toLowerCase();
}

function playSong() {
  if (vocalAudio && accompAudio) {
    vocalAudio.play();
    accompAudio.play();
    console.log("▶️ Playing both audios.");
  }
}

function pauseSong() {
  if (vocalAudio && accompAudio) {
    vocalAudio.pause();
    accompAudio.pause();
    console.log("⏸️ Paused both audios.");
  }
}

function adjustVolume(type, delta) {
  const audio = type === "vocal" ? vocalAudio : accompAudio;
  const slider = document.getElementById(type + "Volume");
  audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
  slider.value = audio.volume;
  console.log(`🔊 ${type} volume adjusted to:`, audio.volume);
}

function skipSeconds(delta) {
  const time = (vocalAudio.currentTime || 0) + delta;
  vocalAudio.currentTime = time;
  accompAudio.currentTime = time;
  console.log(`⏩ Skipped to ${time.toFixed(2)} sec`);
}

document.getElementById("songSelect").addEventListener("change", async function () {
  const tamilName = this.value;
  console.log("🎵 Selected Tamil name:", tamilName);

  await waitForToken();

  const prefix = getFilenameFromTamilName(tamilName);
  const vocalPath = `/WorshipSongs/${prefix}_vocal.mp3`;
  const accompPath = `/WorshipSongs/${prefix}_acc.mp3`;

  try {
    console.log("📥 Fetching vocal audio:", vocalPath);
    const vocalBlob = await getDropboxFileURL(vocalPath);
    vocalAudio.src = URL.createObjectURL(vocalBlob);

    console.log("📥 Fetching accompaniment audio:", accompPath);
    const accompBlob = await getDropboxFileURL(accompPath);
    accompAudio.src = URL.createObjectURL(accompBlob);

    vocalAudio.load();
    accompAudio.load();

    console.log("✅ Both audio files loaded and ready.");
  } catch (error) {
    console.error("❌ Error loading audio files:", error);
  }
});
