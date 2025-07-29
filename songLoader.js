// === songLoader.js ===
// Handles Dropbox streaming of selected song's vocal and accompaniment audio.

async function streamSelectedSong(tamilName) {
  if (!tamilName) return;

  const prefix = encodeURIComponent(tamilName.trim());
  const basePath = "/WorshipSongs/";
  const vocalPath = basePath + prefix + "_vocal.wav.mp3";
  const accompPath = basePath + prefix + "_acc.wav.mp3";

  try {
    // Ensure token is loaded before streaming
    if (!ACCESS_TOKEN) {
      await loadDropboxToken();
    }

    const [vocalBlob, accompBlob] = await Promise.all([
      fetchDropboxFile(vocalPath),
      fetchDropboxFile(accompPath)
    ]);

    vocalAudio.src = URL.createObjectURL(vocalBlob);
    accompAudio.src = URL.createObjectURL(accompBlob);

    console.log("🎵 Both vocal and accompaniment audio streams loaded.");
  } catch (err) {
    console.error("Error streaming audio files:", err);
    alert("⚠️ Failed to stream song audio. Please try again.");
  }
}

async function fetchDropboxFile(path) {
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from Dropbox: ${path}`);
  }

  return await res.blob();
}
