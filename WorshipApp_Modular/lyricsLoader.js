// lyricsLoader.js

/**
 * Loads the lyrics file based on the selected song.
 * It uses the prefix derived from the song's index in the list.
 */
export function loadLyricsForSelectedSong(selectedIndex) {
  const lyricsArea = document.getElementById("lyricsArea");

  // Get prefix by zero-padding index (e.g., 0 → 00, 1 → 01)
  const prefix = String(selectedIndex).padStart(2, '0'); // "00", "01", etc.

  const lyricsFilePath = `lyrics/${prefix}.txt`;

  fetch(lyricsFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error("Lyrics file not found");
      }
      return response.text();
    })
    .then(text => {
      lyricsArea.value = text;
    })
    .catch(error => {
      console.error("Error loading lyrics:", error.message);
      lyricsArea.value = "";
      alert("Error loading lyrics: " + error.message);
    });
}
