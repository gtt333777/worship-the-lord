// WorshipApp_Modular/songLoader.js

async function loadAndPlaySong(tamilName) {
  if (!ACCESS_TOKEN) {
    console.error("❌ ACCESS_TOKEN not ready yet.");
    return;
  }

  const prefix = getPrefixForTamilName(tamilName);
  if (!prefix) {
    console.error("❌ Prefix not found for:", tamilName);
    return;
  }

  const vocalPath = `/WorshipSongs/${prefix}_vocal.mp3`;
  const accompPath = `/WorshipSongs/${prefix}_acc.mp3`;

  try {
    const vocalUrl = await getDropboxFileUrl(vocalPath);
    const accompUrl = await getDropboxFileUrl(accompPath);

    vocalAudio.src = vocalUrl;
    accompAudio.src = accompUrl;

    console.log("🎧 Both audio tracks ready:", prefix);
  } catch (error) {
    console.error("❌ Failed to load audio files:", error);
  }
}

async function getDropboxFileUrl(filePath) {
  const response = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN,
      "Dropbox-API-Arg": JSON.stringify({ path: filePath })
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${filePath}`);
  }

  return URL.createObjectURL(await response.blob());
}

document.getElementById("playButton").addEventListener("click", () => {
  vocalAudio.currentTime = 0;
  accompAudio.currentTime = 0;
  vocalAudio.play();
  accompAudio.play();
  console.log("▶️ Play button clicked.");
});

document.getElementById("pauseButton").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
  console.log("⏸️ Pause button clicked.");
});
