import { loadDropboxToken } from './tokenLoader.js';
import { loadSongNames } from './songNamesLoader.js';
import { loadLyricsForSelectedSong } from './lyricsLoader.js';

document.addEventListener("DOMContentLoaded", async () => {
  console.log("App initialized.");
  await loadDropboxToken();
  await loadSongNames();

  document.getElementById("songSelect").addEventListener("change", (e) => {
    const selectedOption = e.target.selectedOptions[0];
    loadLyricsForSelectedSong(selectedOption);
  });
});
