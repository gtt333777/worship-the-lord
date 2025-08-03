// lyricsLoader.js
console.log("lyricsLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", function () {
  const dropdown = document.getElementById("songSelect");
  const lyricsBox = document.getElementById("lyricsTextArea");

  if (!dropdown) {
    console.error("lyricsLoader.js: #songSelect not found");
    return;
  }

  if (!lyricsBox) {
    console.error("lyricsLoader.js: #lyricsTextArea not found");
    return;
  }

  dropdown.addEventListener("change", function () {
    const songName = dropdown.value.trim();
    if (!songName) return;

    const lyricsFile = `lyrics/${songName}.txt`;
    console.log(`lyricsLoader.js: Fetching lyrics from ${lyricsFile}`);

    fetch(lyricsFile)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        lyricsBox.value = text;
        console.log(`lyricsLoader.js: Loaded lyrics for "${songName}"`);
      })
      .catch((err) => {
        lyricsBox.value = `❌ Failed to load lyrics: ${err}`;
        console.error("lyricsLoader.js:", err);
      });
  });
});
