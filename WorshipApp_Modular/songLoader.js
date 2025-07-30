console.log("🔐 ACCESS_TOKEN at load time:", ACCESS_TOKEN);
let vocalAudio = new Audio();
let accompAudio = new Audio();

// === Volume Control ===
document.getElementById("vocalVolume").addEventListener("input", e => {
  vocalAudio.volume = parseFloat(e.target.value);
});
document.getElementById("accompVolume").addEventListener("input", e => {
  accompAudio.volume = parseFloat(e.target.value);
});

// === Skip Forward / Backward ===
document.getElementById("skipForward").addEventListener("click", () => {
  vocalAudio.currentTime += 1;
  accompAudio.currentTime += 1;
});
document.getElementById("skipBackward").addEventListener("click", () => {
  vocalAudio.currentTime -= 1;
  accompAudio.currentTime -= 1;
});

// === Play / Pause Buttons ===
document.getElementById("playButton").addEventListener("click", () => {
  console.log("▶️ Play pressed");
  vocalAudio.play();
  accompAudio.play();
});
document.getElementById("pauseButton").addEventListener("click", () => {
  console.log("⏸️ Pause pressed");
  vocalAudio.pause();
  accompAudio.pause();
});

// === Load & Stream Audio When Song Selected ===
document.getElementById("songSelect").addEventListener("change", async e => {
  const tamilName = e.target.value;
  console.log(`🎵 Selected song: ${tamilName}`);

  const vocalFile = `${tamilName}_vocal.mp3`;
  const accompFile = `${tamilName}_acc.mp3`;

  try {
    const [vocalURL, accompURL] = await Promise.all([
      getDropboxFileURL(vocalFile),
      getDropboxFileURL(accompFile)
    ]);

    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;

    console.log("✅ Audio sources set:");
    console.log("🎤 Vocal:", vocalURL);
    console.log("🎹 Accompaniment:", accompURL);

    // Preload and sync
    await Promise.all([
      vocalAudio.load(),
      accompAudio.load()
    ]);
  } catch (err) {
    console.error("❌ Failed to load audio:", err);
  }
});

// === Get Dropbox Streaming URL ===
async function getDropboxFileURL(filename) {
  const fullPath = DROPBOX_FOLDER + filename;
  console.log(`📦 Fetching: ${fullPath}`);

  const response = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + ACCESS_TOKEN,
      "Dropbox-API-Arg": JSON.stringify({ path: fullPath })
    }
  });

  if (!response.ok) {
    throw new Error(`Dropbox download failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return url;
}
