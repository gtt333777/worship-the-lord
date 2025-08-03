// lyricsLoader.js

console.log("🎵 lyricsLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("songSelect");
  const lyricsBox = document.getElementById("lyricsTextArea");

  if (!dropdown) {
    console.error("❌ lyricsLoader.js: #songSelect not found");
    return;
  }
  if (!lyricsBox) {
    console.error("❌ lyricsLoader.js: #lyricsTextArea not found");
    return;
  }

  dropdown.addEventListener("change", () => {
    const selectedName = dropdown.value.trim();
    if (!selectedName) {
      console.warn("⚠️ No song selected");
      lyricsBox.value = "";
      return;
    }

    const lyricsPath = `lyrics/${selectedName}.txt`;
    console.log(`📥 lyricsLoader.js: Loading lyrics from → ${lyricsPath}`);

    fetch(lyricsPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        lyricsBox.value = data;
        console.log("✅ lyricsLoader.js: Lyrics loaded and displayed");
      })
      .catch(error => {
        lyricsBox.value = "";
        console.error(`❌ lyricsLoader.js: Failed to load lyrics for "${selectedName}" →`, error);
      });
  });

  console.log("✅ lyricsLoader.js: Event listener attached to #songSelect");
});
