document.addEventListener('DOMContentLoaded', () => {
  console.log("📖 lyricsLoader.js: DOM loaded");
  const dropdown = document.getElementById('songDropdown');
  if (dropdown) {
    dropdown.addEventListener('change', handleSongChange);
  } else {
    console.warn("⚠️ lyricsLoader.js: songDropdown not found in DOM");
  }
});

function handleSongChange() {
  const dropdown = document.getElementById('songDropdown');
  const selectedSong = dropdown.value.trim();
  console.log("🎵 handleSongChange: Selected song:", selectedSong);

  if (!selectedSong) {
    console.warn("⚠️ No song selected.");
    return;
  }

  const lyricsFile = findLyricsFileFromSuffix(selectedSong);
  console.log("📄 Matched lyrics file:", lyricsFile);
  fetchLyricsAndDisplay(lyricsFile);
}

function findLyricsFileFromSuffix(selectedTamilName) {
  const suffix = selectedTamilName.trim();
  const files = window.availableLyricsFiles || [];
  for (let file of files) {
    if (file.endsWith('.txt') && file.includes(suffix)) {
      return `lyrics/${file}`;
    }
  }
  console.warn("❌ No matching .txt file found for:", suffix);
  return null;
}

function fetchLyricsAndDisplay(lyricsPath) {
  const lyricsBox = document.getElementById('lyricsBox');
  if (!lyricsBox) {
    console.error("❌ lyricsBox not found in DOM.");
    return;
  }

  if (!lyricsPath) {
    lyricsBox.value = "❌ No lyrics available for selected song.";
    return;
  }

  fetch(lyricsPath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
    })
    .then(text => {
      console.log("✅ Lyrics loaded.");
      lyricsBox.value = text;
    })
    .catch(error => {
      console.error("❌ Error loading lyrics:", error);
      lyricsBox.value = "❌ Error loading lyrics.";
    });
}
