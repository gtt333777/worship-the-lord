// WorshipApp_Modular/initApp.js

import { loadToken } from "./tokenLoader.js";
import { loadSongNames } from "./songNamesLoader.js";
import { loadLyrics } from "./lyricsLoader.js";
import {
  vocalAudio,
  accompAudio,
  loadAudioFiles,
  setupVolumeControls,
  playBoth,
  pauseBoth,
  syncDuringPlayback
} from "./songLoader.js";

// === DOM Elements ===
const songSelect = document.getElementById("songSelect");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");

let ACCESS_TOKEN = "";

// === INIT APP ===
async function initApp() {
  try {
    ACCESS_TOKEN = await loadToken();
    console.log("Dropbox token loaded successfully!");

    const songNames = await loadSongNames();
    populateSongDropdown(songNames);
    console.log("Song names loaded successfully!");

    setupVolumeControls();
    syncDuringPlayback();

    songSelect.addEventListener("change", async () => {
      const selected = songSelect.value;
      if (!selected) return;

      const prefix = selected.split(" ")[0]; // Assume filename prefix comes first
      await loadLyrics(prefix);
      loadAudioFiles(prefix, ACCESS_TOKEN);
    });

    playBtn.addEventListener("click", () => {
      playBoth();
    });

    pauseBtn.addEventListener("click", () => {
      pauseBoth();
    });

    // Preload first song if one is selected
    if (songSelect.value) {
      const prefix = songSelect.value.split(" ")[0];
      await loadLyrics(prefix);
      loadAudioFiles(prefix, ACCESS_TOKEN);
    }

  } catch (error) {
    console.error("App initialization error:", error);
    alert("Something went wrong during app initialization.");
  }
}

// === Helper: Populate dropdown ===
function populateSongDropdown(songNames) {
  songNames.forEach(name => {
    const option = document.createElement("option");
    option.textContent = name;
    songSelect.appendChild(option);
  });
}

initApp();
