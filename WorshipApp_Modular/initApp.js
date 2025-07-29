// === initApp.js ===
function initializeApp() {
  const songSelect = document.getElementById("songSelect");

  if (songSelect) {
    songSelect.addEventListener("change", async () => {
      const selectedSong = songSelect.value;
      await loadLyricsForSelectedSong(selectedSong);  // ✅ Now global function
    });
  }

  console.log("App initialized.");
}

initializeApp();
