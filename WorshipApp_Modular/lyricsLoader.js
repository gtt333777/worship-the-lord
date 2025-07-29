export async function loadLyricsForSelectedSong(songName) {
  try {
    const lyricsFileName = `lyrics/${songName.trim()}.txt`;
    const response = await fetch(lyricsFileName);

    if (!response.ok) {
      throw new Error("Lyrics file not found");
    }

    const lyricsText = await response.text();
    const lyricsBox = document.getElementById("lyricsDisplay");
    if (lyricsBox) {
      lyricsBox.value = lyricsText;
    } else {
      console.error("Textarea for lyrics not found");
    }

  } catch (err) {
    console.error("Error loading lyrics:", err);
    alert("Error loading lyrics: " + err.message);
  }
}
