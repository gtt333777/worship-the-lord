// 🎵 songLoader.js: Handles song selection and updates global song name
document.addEventListener("DOMContentLoaded", () => {
  console.log("songLoader.js: Elements found, setting up handler");

  const songSelect = document.getElementById("songSelect");

  if (!songSelect) {
    console.error("songLoader.js: #songSelect not found");
    return;
  }

  songSelect.addEventListener("change", async () => {
    const selectedTamilName = songSelect.value.trim();
    window.currentSongName = selectedTamilName; // ✅ Needed for loopPlayer.js
    console.log("🎵 Selected Tamil name:", selectedTamilName);

    const prefix = getPrefixForTamilName(selectedTamilName);
    if (!prefix) {
      console.warn("No prefix found for:", selectedTamilName);
      return;
    }

    const vocalURL = await buildDropboxUrl(`${prefix}_vocal.mp3`);
    const accompURL = await buildDropboxUrl(`${prefix}_acc.mp3`);
    const lyricsURL = `lyrics/${prefix}.txt`;

    const vocalAudio = document.getElementById("vocalAudio");
    const accompAudio = document.getElementById("accompAudio");

    if (vocalAudio && accompAudio) {
      vocalAudio.src = vocalURL;
      accompAudio.src = accompURL;
      console.log("🎧 Updated audio sources");
    } else {
      console.warn("Audio elements not found.");
    }

    // ✅ Load lyrics
    fetch(lyricsURL)
      .then(response => response.text())
      .then(text => {
        const lyricsBox = document.getElementById("lyricsTextArea");
        if (lyricsBox) lyricsBox.value = text;
        console.log("📜 Lyrics loaded successfully.");
      })
      .catch(err => {
        console.error("⚠️ Failed to load lyrics:", err);
      });
  });
});

// Helper to get prefix from selected Tamil name
function getPrefixForTamilName(tamilName) {
  const lines = window.songNameMappings || [];
  for (let line of lines) {
    const parts = line.split("|");
    if (parts.length === 2 && parts[0].trim() === tamilName.trim()) {
      return parts[1].trim();
    }
  }
  return null;
}
