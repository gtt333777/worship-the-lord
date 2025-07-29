export async function loadLyricsForSelectedSong(songName) {
  try {
    const cleanName = songName.toString().trim(); // make sure it's a string
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
