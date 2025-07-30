function getLyricsPrefix(tamilName) {
  return tamilName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

async function loadLyricsForSelectedSong(selectedOption) {
  try {
    const songName = selectedOption.textContent;
    const prefix = getLyricsPrefix(songName);
    const response = await fetch(`lyrics/${prefix}.txt`);
    const lyricsText = await response.text();
    document.querySelector("textarea").value = lyricsText;
  } catch (err) {
    alert("Error loading lyrics: " + err.message);
    console.error("Error loading lyrics:", err);
  }
}

export { loadLyricsForSelectedSong };
