// WorshipApp_Modular/initApp.js
import { loadDropboxToken } from './tokenLoader.js';
import { loadSongNames } from './songNamesLoader.js';
import { loadLyricsForSelectedSong } from './lyricsLoader.js';

document.addEventListener("DOMContentLoaded", async () => {
  await loadDropboxToken();
  await loadSongNames();

  const songSelect = document.getElementById("songSelect");
  songSelect.addEventListener("change", (e) => {
    const selectedOption = e.target.selectedOptions[0];
    loadLyricsForSelectedSong(selectedOption);
  });

  console.log("App initialized.");
});
