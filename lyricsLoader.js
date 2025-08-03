console.log("lyricsLoader.js: Loaded");

function loadLyricsForSong(songName) {
  const lyricsPath = `lyrics/${songName}.txt`;
  const lyricsTextArea = document.getElementById("lyricsTextArea");

  if (!lyricsTextArea) {
    console.error("lyricsLoader.js: Could not find textarea with id 'lyricsTextArea'");
    return;
  }

  console.log(`lyricsLoader.js: Attempting to fetch lyrics from: ${lyricsPath}`);

  fetch(lyricsPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      return response.text();
    })
    .then(text => {
      lyricsTextArea.value = text;
      console.log("lyricsLoader.js: Lyrics loaded successfully.");
    })
    .catch(error => {
      lyricsTextArea.value = "";
      console.warn(`lyricsLoader.js: Failed to load lyrics for "${songName}".`, error);
    });
}
