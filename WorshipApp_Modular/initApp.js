// WorshipApp_Modular/initApp.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // ✅ Load short-lived Dropbox token
    await loadDropboxToken();

    // ✅ Load song names from lyrics/songs_names.txt
    await loadSongNames();

    // ✅ Setup bookmarks UI
    setupBookmarkUI();

    // ✅ Set up event listeners for play/pause and segment skipping
    document.getElementById("playBtn").addEventListener("click", () => {
      startSegmentPlayback(); // begins playing from selected segment
    });

    document.getElementById("pauseBtn").addEventListener("click", () => {
      pauseAudio();
    });

    // ✅ Segment navigation buttons
    document.getElementById("bookmarkDropdown").addEventListener("change", e => {
      if (e.target.value) {
        loadSelectedSongByBookmark(e.target.value);
        e.target.value = "";
      }
    });

  } catch (error) {
    console.error("Initialization failed:", error);
    alert("Something went wrong during app initialization.");
  }
});
