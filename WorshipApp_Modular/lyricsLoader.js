// === lyricsLoader.js ===

export async function loadLyricsForSelectedSong(songName) {
  try {
    // Clean the name to match exact file
    const cleanName = songName.trim();
    const lyricsFilePath = `lyrics/${cleanName}.txt`;

    const response = await fetch(lyricsFilePath);
    if (!response.ok) {
      throw new Error("Lyrics file not found");
    }

    const lyricsText = await response.text();
    const textarea = document.getElementById("lyricsDisplay");

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
