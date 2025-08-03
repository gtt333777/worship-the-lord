// lyricsLoader.js

console.log("lyricsLoader.js: Waiting for lyricsLoader.html to finish loading...");

document.addEventListener("lyricsLoaderLoaded", () => {
  console.log("lyricsLoader.js: lyricsLoader.html loaded. Initializing...");

  const lyricsTextArea = document.getElementById("lyricsBox");
  const songSelect = document.getElementById("songSelect");

  if (!lyricsTextArea || !songSelect) {
    console.error("lyricsLoader.js: Missing textarea or song selector.");
    return;
  }

  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    const suffix = selectedSong.trim();
    const lyricsFilePath = `lyrics/${suffix}.txt`;

    fetch(lyricsFilePath)
      .then((response) => {
        if (!response.ok) throw new Error(`Lyrics not found for ${suffix}`);
        return response.text();
      })
      .then((text) => {
        lyricsTextArea.value = text;
        console.log(`lyricsLoader.js: Loaded lyrics for ${suffix}`);
      })
      .catch((error) => {
        console.error("lyricsLoader.js: Error fetching lyrics:", error);
        lyricsTextArea.value = "[Lyrics not found]";
      });
  });

  console.log("lyricsLoader.js: Setup complete.");
});
