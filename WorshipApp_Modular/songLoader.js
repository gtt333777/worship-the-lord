let vocalAudio = new Audio();
let accompAudio = new Audio();
let loops = [];
let loopIndex = 0;

async function loadAndPlaySelectedSong(tamilName) {
  const prefix = getPrefixForTamilName(tamilName);
  if (!prefix) {
    console.error("No prefix found for song:", tamilName);
    return;
  }

  console.log("🎵 Selected Tamil name:", tamilName);
  console.log("🎼 Derived prefix:", prefix);

  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();
    const accessToken = data.access_token;
    console.log("🟢 Dropbox token loaded.");

    const vocalPath = `/WorshipSongs/${prefix}_vocal.mp3`;
    const accompPath = `/WorshipSongs/${prefix}_acc.mp3`;

    const vocalUrl = await getDropboxFileUrl(vocalPath, accessToken);
    const accompUrl = await getDropboxFileUrl(accompPath, accessToken);

    vocalAudio.src = vocalUrl;
    accompAudio.src = accompUrl;

    console.log("✅ Both audio tracks loaded:", {
      vocal: vocalPath,
      accomp: accompPath
    });

  } catch (err) {
    console.error("Error loading audio tracks:", err);
  }
}

async function getDropboxFileUrl(path, accessToken) {
  const response = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path })
    }
  });

  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

document.getElementById("playBtn").addEventListener("click", () => {
  vocalAudio.currentTime = 0;
  accompAudio.currentTime = 0;
  vocalAudio.play();
  accompAudio.play();
  console.log("▶️ Play button clicked");
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
  console.log("⏸️ Pause button clicked");
});

function setAudioStartTime(seconds) {
  vocalAudio.currentTime = seconds;
  accompAudio.currentTime = seconds;
  vocalAudio.play();
  accompAudio.play();
}
