// lyricsLoader.js

console.log("lyricsLoader.js: Started");

document.addEventListener("DOMContentLoaded", () => {
  const lyricsTextArea = document.getElementById("lyricsBox");
  const songSelect = document.getElementById("songSelect");

  if (!lyricsTextArea || !songSelect) {
    console.error("lyricsLoader: Missing textarea or song select element");
    return;
  }

  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    const suffix = selectedSong.trim();
    const lyricsFilePath = `lyrics/${suffix}.txt`;

    fetch(lyricsFilePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch lyrics for ${suffix}`);
        }
        return response.text();
      })
      .then((text) => {
        lyricsTextArea.value = text;
        console.log(`lyricsLoader: Loaded lyrics for ${suffix}`);
      })
      .catch((error) => {
        console.error("lyricsLoader: Error loading lyrics:", error);
        lyricsTextArea.value = "[Lyrics not found]";
      });
  });

  console.log("lyricsLoader.js: Loaded");
});
