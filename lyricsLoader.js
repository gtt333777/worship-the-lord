// lyricsLoader.js

document.addEventListener("DOMContentLoaded", () => {
  const lyricsTextArea = document.getElementById("lyricsTextArea");
  const songDropdown = document.getElementById("songDropdown");

  if (!lyricsTextArea || !songDropdown) {
    console.error("lyricsLoader.js: Missing textarea or dropdown element");
    return;
  }

  console.log("lyricsLoader.js: Adding event listener to songDropdown");

  songDropdown.addEventListener("change", () => {
    const selectedSong = songDropdown.value.trim();
    if (!selectedSong) {
      lyricsTextArea.value = "";
      return;
    }

    const lyricsFilePath = `lyrics/${encodeURIComponent(selectedSong)}.txt`;
    console.log(`lyricsLoader.js: Trying to load lyrics from: ${lyricsFilePath}`);

    fetch(lyricsFilePath)
      .then((response) => {
        if (!response.ok) throw new Error(`Lyrics not found for ${selectedSong}`);
        return response.text();
      })
      .then((text) => {
        lyricsTextArea.value = text;
        console.log(`lyricsLoader.js: ✅ Loaded lyrics for ${selectedSong}`);
      })
      .catch((error) => {
        console.error("lyricsLoader.js: ❌ Error fetching lyrics:", error);
        lyricsTextArea.value = "[Lyrics not found]";
      });
  });
});
