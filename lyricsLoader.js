document.addEventListener("DOMContentLoaded", () => {
  console.log("lyricsLoader.js: Loaded");

  const lyricsBox = document.getElementById("lyricsBox");
  const songSelect = document.getElementById("songDropdown");

  if (!lyricsBox || !songSelect) {
    console.error("lyricsLoader: Missing textarea or song select element");
    return;
  }

  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    const suffix = selectedSong.trim();
    const filePath = `lyrics/${suffix}.txt`;

    fetch(filePath)
      .then((response) => {
        if (!response.ok) throw new Error("Lyrics file not found.");
        return response.text();
      })
      .then((text) => {
        lyricsBox.value = text;
      })
      .catch((error) => {
        console.error("lyricsLoader: Failed to load lyrics:", error);
        lyricsBox.value = "Lyrics not available.";
      });
  });
});
