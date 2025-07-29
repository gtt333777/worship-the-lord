// === initApp.js ===
import { populateSongList } from "./songNamesLoader.js";
import { loadLyricsForSelectedSong } from "./lyricsLoader.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await populateSongList();

    const songSelect = document.getElementById("songSelect");
    if (songSelect) {
      songSelect.addEventListener("change", async () => {
        const selectedSong = songSelect.value;
        await loadLyricsForSelectedSong(selectedSong);
      });

      // Initial lyrics load for first song (optional)
      if (songSelect.value) {
        await loadLyricsForSelectedSong(songSelect.value);
      }
    } else {
      console.error("Song select dropdown not found");
    }

    console.log("App initialized.");
  } catch (err) {
    console.error("Error initializing app:", err);
  }
});
