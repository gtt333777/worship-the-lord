import { loadDropboxToken } from './tokenLoader.js';
import { loadSongNames } from './songNamesLoader.js';
import { loadLyricsForSelectedSong } from './lyricsLoader.js';

async function initApp() {
  try {
    await loadDropboxToken();
    console.log("Dropbox token loaded successfully!");

    const songNames = await loadSongNames();
    console.log("Song names loaded successfully!");

    const songSelect = document.getElementById("songSelect");
    songNames.forEach(name => {
      const option = document.createElement("option");
      option.textContent = name; // Visible Tamil name
      songSelect.appendChild(option);
    });

    // Load lyrics when user changes song selection
    songSelect.addEventListener("change", (e) => {
      const selectedOption = e.target.selectedOptions[0];
      loadLyricsForSelectedSong(selectedOption);
    });

    // Trigger initial load for the first song
    if (songSelect.options.length > 0) {
      songSelect.selectedIndex = 0;
      loadLyricsForSelectedSong(songSelect.options[0]);
    }

    console.log("App initialized.");
  } catch (error) {
    console.error("Error initializing app:", error);
    alert("Initialization error: " + error.message);
  }
}

initApp();
