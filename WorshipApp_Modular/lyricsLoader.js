export async function loadLyricsForSelectedSong(songNameOption) {
  try {
    // Get the selected <option>'s text content
    const songName = songNameOption.textContent.trim(); // This is the visible name in dropdown (Tamil name)

    // Lyrics files are named as `lyrics/<Tamil Name>.txt`
    const lyricsPath = `lyrics/${songName}.txt`;

    const response = await fetch(lyricsPath);
    if (!response.ok) {
      throw new Error("Lyrics file not found");
    }

    const lyricsText = await response.text();

    const lyricsBox = document.getElementById("lyricsDisplay");
    if (lyricsBox) {
      lyricsBox.value = lyricsText;
    } else {
      console.warn("Lyrics display textarea not found");
    }

  } catch (err) {
    console.error("Error loading lyrics:", err);
    alert("Error loading lyrics: " + err.message);
  }
}
