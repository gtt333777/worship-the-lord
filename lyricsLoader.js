console.log("📖 lyricsLoader.js: Loaded");

function loadLyricsForSong(selectedSongName) {
  console.log("📖 lyricsLoader.js: Selected song:", selectedSongName);

  if (!selectedSongName || typeof selectedSongName !== "string") {
    console.warn("📖 lyricsLoader.js: Invalid song name.");
    return;
  }

  const lyricsFilePath = `lyrics/${selectedSongName}.txt`;
  console.log("📖 lyricsLoader.js: Attempting to fetch lyrics from:", lyricsFilePath);

  fetch(lyricsFilePath)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }
      return res.text();
    })
    .then((lyrics) => {
      const lyricsBox = document.getElementById("lyricsBox");
      if (lyricsBox) {
        lyricsBox.value = lyrics;
        console.log("📖 lyricsLoader.js: Lyrics loaded successfully.");
      } else {
        console.error("📖 lyricsLoader.js: ❌ lyricsBox not found in DOM.");
      }
    })
    .catch((err) => {
      console.warn("📖 lyricsLoader.js: Could not load lyrics file:", err.message);
      const lyricsBox = document.getElementById("lyricsBox");
      if (lyricsBox) {
        lyricsBox.value = "🎶 Lyrics not available for this song.";
      }
    });
}
