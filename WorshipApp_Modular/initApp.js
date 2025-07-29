// WorshipApp_Modular/initApp.js
import { loadLyricsForSelectedSong } from './lyricsLoader.js';

window.initApp = function () {
  const songSelect = document.getElementById("songSelect");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  playBtn.addEventListener("click", () => {
    window.vocalAudio.play();
    window.accompAudio.play();
  });

  pauseBtn.addEventListener("click", () => {
    window.vocalAudio.pause();
    window.accompAudio.pause();
  });

  songSelect.addEventListener("change", () => {
    const selectedIndex = songSelect.selectedIndex;
    loadLyricsForSelectedSong(selectedIndex);

    const prefix = String(selectedIndex).padStart(2, '0'); // "00", "01", etc.

    // Set audio source URLs
    const vocalUrl = `${window.DROPBOX_FOLDER}${prefix}_vocal.mp3`;
    const accompUrl = `${window.DROPBOX_FOLDER}${prefix}_acc.mp3`;

    // Set audio sources
    window.vocalAudio.src = `https://content.dropboxapi.com/2/files/download`;
    window.vocalAudio.setAttribute("data-path", vocalUrl);
    window.accompAudio.src = `https://content.dropboxapi.com/2/files/download`;
    window.accompAudio.setAttribute("data-path", accompUrl);

    // Force token refresh and load
    if (typeof loadDropboxToken === "function") {
      loadDropboxToken(); // reload token before playing new song
    }
  });

  console.log("App initialized.");
};

document.addEventListener("DOMContentLoaded", window.initApp);
