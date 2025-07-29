// === songLoader.js ===

async function streamSelectedSong(songName) {
  try {
    const response = await fetch("lyrics/songs_names.txt");
    const songList = await response.text();
    const songNames = songList.trim().split("\n");
    const index = songNames.findIndex(name => name.trim() === songName.trim());

    if (index === -1) {
      throw new Error("Prefix not found for selected song");
    }

    const prefix = String(index + 1).padStart(2, '0');

    const vocalUrl = await getDropboxURL(`${prefix}_vocal.mp3`);
    const accompUrl = await getDropboxURL(`${prefix}_acc.mp3`);

    vocalAudio.src = vocalUrl;
    accompAudio.src = accompUrl;
  } catch (err) {
    console.error("Error streaming audio:", err);
    alert("Error streaming audio: " + err.message);
  }
}
