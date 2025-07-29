// === lyricsLoader.js ===
// Load lyrics from lyrics/ folder using auto-derived prefix
async function loadLyricsForSelectedSong(songName) {
  try {
    const response = await fetch("lyrics/songs_names.txt");
    const songList = await response.text();
    const songNames = songList.trim().split("\n");
    const index = songNames.findIndex(name => name.trim() === songName.trim());

    if (index === -1) {
      throw new Error("Prefix not found for selected song");
    }

    const prefix = String(index + 1).padStart(2, '0');
    const lyricsFilePath = `lyrics/${prefix}.txt`;

    const lyricsResponse = await fetch(lyricsFilePath);
    if (!lyricsResponse.ok) {
      throw new Error("Lyrics file not found");
    }

    const lyricsText = await lyricsResponse.text();
    const textarea = document.getElementById("lyricsArea");
    if (textarea) {
      textarea.value = lyricsText;
    } else {
      console.error("Lyrics textarea not found in DOM");
    }

  } catch (err) {
    console.error("Error loading lyrics:", err);
    alert("Error loading lyrics: " + err.message);
  }
}
