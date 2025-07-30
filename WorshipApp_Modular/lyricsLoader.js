// lyricsLoader.js

function derivePrefixFromIndex(index) {
  // Derives song file prefix based on index (e.g., song1, song2, ...)
  return `song${index + 1}`;
}

async function loadLyricsForSelectedSong(optionElement) {
  const index = optionElement.index;
  const prefix = derivePrefixFromIndex(index);
  const lyricsFile = `lyrics/${prefix}.txt`;

  try {
    const response = await fetch(lyricsFile);
    if (!response.ok) {
      throw new Error(`Lyrics file not found: ${lyricsFile}`);
    }
    const text = await response.text();
    document.getElementById("lyricsBox").value = text;
  } catch (error) {
    console.error("Error loading lyrics:", error);
    alert("Error loading lyrics: " + error.message);
  }
}

export { loadLyricsForSelectedSong };
