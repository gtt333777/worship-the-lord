export async function loadLyricsForSelectedSong(songNameObject) {
  try {
    // Support both string and object format (from dropdowns)
    const songName = (typeof songNameObject === "string") ? songNameObject : songNameObject.text;

    // Construct the correct file path from song name
    const lyricsFileName = `lyrics/${songName.trim()}.txt`;

    // Try fetching the lyrics file
    const response = await fetch(lyricsFileName);

    if (!response.ok) {
      throw new Error("Lyrics file not found");
    }

    const lyricsText = await response.text();

    // Show in the textarea
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
