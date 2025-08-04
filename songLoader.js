// ✅ songLoader.js
console.log("🎵 songLoader.js: Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");

  if (!songSelect) {
    console.error("❌ songLoader.js: #songSelect not found");
    return;
  }

  console.log("🎵 songLoader.js: #songSelect found, attaching change handler");

  songSelect.addEventListener("change", async () => {
    const songName = songSelect.value.trim();
    if (!songName) return;

    console.log(`🎶 songLoader.js: Song selected: ${songName}`);

    try {
      // Trigger loading lyrics, loops, and audio
      if (typeof loadLyrics === "function") {
        console.log("📄 songLoader.js: Calling loadLyrics()");
        loadLyrics(songName);
      }

      if (typeof loadLoops === "function") {
        console.log("🔁 songLoader.js: Calling loadLoops()");
        loadLoops(songName);
      }

      if (typeof loadDropboxAudio === "function") {
        console.log("🎧 songLoader.js: Calling loadDropboxAudio()");
        loadDropboxAudio(songName);
      }
    } catch (err) {
      console.error("❌ songLoader.js: Error while loading song resources", err);
    }
  });
});
