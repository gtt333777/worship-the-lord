// "Worship The Lord" main.js
let songs = [];
let currentSong = null;

const songSelect = document.getElementById("song-select");
const audioSection = document.getElementById("audio-section");
const songTitle = document.getElementById("song-title");
const playBtn = document.getElementById("play-btn");
const vocalPlayer = document.getElementById("vocal-player");
const accPlayer = document.getElementById("acc-player");
const vocMinus = document.getElementById("voc-minus");
const vocPlus = document.getElementById("voc-plus");
const vocVol = document.getElementById("voc-vol");
const accMinus = document.getElementById("acc-minus");
const accPlus = document.getElementById("acc-plus");
const accVol = document.getElementById("acc-vol");
const lyricsPdf = document.getElementById("lyrics-pdf");

async function loadSongs() {
  try {
    const response = await fetch("songs.json");
    songs = await response.json();
    if (!Array.isArray(songs) || songs.length === 0) {
      songSelect.innerHTML = '<option>No songs available</option>';
      audioSection.style.display = "none";
      return;
    }
    songSelect.innerHTML = songs
      .map((song, idx) => `<option value="${idx}">${song.displayName}</option>`)
      .join("");
    audioSection.style.display = "block";
    // Select first song by default
    loadSong(0);
  } catch (e) {
    songSelect.innerHTML = '<option>Error loading songs</option>';
    audioSection.style.display = "none";
  }
}

function dropboxStreamUrl(url) {
  if (!url) return "";
  // Convert dropbox.com link to direct stream link
  if (url.startsWith("https://www.dropbox.com/")) {
    url = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    url = url.split("?")[0]; // Remove query params
  }
  // Already direct link? OK.
  return url;
}

function loadSong(idx) {
  currentSong = songs[idx];
  songTitle.textContent = currentSong.displayName || "Untitled";
  // Audio
  vocalPlayer.src = dropboxStreamUrl(currentSong.vocalsFileId);
  accPlayer.src = dropboxStreamUrl(currentSong.accompFileId);
  vocalPlayer.currentTime = 0;
  accPlayer.currentTime = 0;
  vocalPlayer.volume = 1.0;
  accPlayer.volume = 1.0;
  vocVol.textContent = "100%";
  accVol.textContent = "100%";
  // Lyrics
  if (currentSong.lyricsPdfFileId) {
    lyricsPdf.src = dropboxStreamUrl(currentSong.lyricsPdfFileId) + "#toolbar=0&navpanes=0";
    lyricsPdf.style.display = "block";
  } else {
    lyricsPdf.style.display = "none";
  }
  playBtn.textContent = "▶️ Play";
  playBtn.disabled = false;
}

let syncTimeout = null;

function playBoth() {
  // Sync the two players (pause if any is playing)
  vocalPlayer.pause(); accPlayer.pause();
  vocalPlayer.currentTime = 0; accPlayer.currentTime = 0;
  let played = 0;
  vocalPlayer.onplay = accPlayer.onplay = () => { played++; if (played === 2) playBtn.textContent = "⏸️ Pause"; }
  vocalPlayer.onpause = accPlayer.onpause = () => { playBtn.textContent = "▶️ Play"; }
  vocalPlayer.play();
  accPlayer.play();
  // When either ends, stop both.
  const stopAll = () => { vocalPlayer.pause(); accPlayer.pause(); playBtn.textContent = "▶️ Play"; };
  vocalPlayer.onended = stopAll;
  accPlayer.onended = stopAll;
}

function pauseBoth() {
  vocalPlayer.pause();
  accPlayer.pause();
  playBtn.textContent = "▶️ Play";
}

playBtn.onclick = () => {
  if (vocalPlayer.paused && accPlayer.paused) playBoth();
  else pauseBoth();
};

songSelect.onchange = (e) => {
  loadSong(Number(songSelect.value));
  pauseBoth();
};

vocMinus.onclick = () => {
  vocalPlayer.volume = Math.max(0, vocalPlayer.volume - 0.05);
  vocVol.textContent = Math.round(vocalPlayer.volume * 100) + "%";
};
vocPlus.onclick = () => {
  vocalPlayer.volume = Math.min(1, vocalPlayer.volume + 0.05);
  vocVol.textContent = Math.round(vocalPlayer.volume * 100) + "%";
};
accMinus.onclick = () => {
  accPlayer.volume = Math.max(0, accPlayer.volume - 0.05);
  accVol.textContent = Math.round(accPlayer.volume * 100) + "%";
};
accPlus.onclick = () => {
  accPlayer.volume = Math.min(1, accPlayer.volume + 0.05);
  accVol.textContent = Math.round(accPlayer.volume * 100) + "%";
};

window.onload = loadSongs;
