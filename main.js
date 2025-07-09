// Worship The Lord - Demo Song List (Add more songs as needed)
const songs = [
  {
    title: "Anantha Thuthi",
    vocalsUrl: "https://drive.google.com/uc?export=download&id=YOUR_VOCALS_FILE_ID",
    accompUrl: "https://drive.google.com/uc?export=download&id=YOUR_ACCOMP_FILE_ID",
    lyrics: `
      ஆனந்தத் தூதி பாடுவோம்<br>
      அற்புதத் தந்தை வாழ்த்துவோம்<br>
      கர்த்தருக்கே மகிமை<br>
      கருணை செய்யும் தேவனுக்கே...
      <br><br>
      (Add more lyrics here)
    `
  }
  // Add more song objects here
];

// Set current song (only one for demo)
let currentSong = songs[0];

const audioVocals = document.getElementById('audioVocals');
const audioAccomp = document.getElementById('audioAccomp');
const btnPlay = document.getElementById('btnPlay');
const volVocals = document.getElementById('volVocals');
const volAccomp = document.getElementById('volAccomp');
const lyricsBox = document.getElementById('lyricsBox');
const songTitle = document.getElementById('songTitle');

// Load song details
function loadSong(song) {
  audioVocals.src = song.vocalsUrl;
  audioAccomp.src = song.accompUrl;
  songTitle.textContent = song.title;
  lyricsBox.innerHTML = song.lyrics;
  audioVocals.currentTime = 0;
  audioAccomp.currentTime = 0;
  btnPlay.textContent = "Play";
  btnPlay.classList.remove("paused");
}
loadSong(currentSong);

// Sync play/pause
btnPlay.onclick = function() {
  if (audioVocals.paused || audioAccomp.paused) {
    // Start both in sync
    audioVocals.currentTime = audioAccomp.currentTime = 0;
    audioVocals.play();
    audioAccomp.play();
    btnPlay.textContent = "Pause";
    btnPlay.classList.add("paused");
  } else {
    audioVocals.pause();
    audioAccomp.pause();
    btnPlay.textContent = "Play";
    btnPlay.classList.remove("paused");
  }
};

// Keep playback in sync if user seeks
audioVocals.onseeked = function() { audioAccomp.currentTime = audioVocals.currentTime; };
audioAccomp.onseeked = function() { audioVocals.currentTime = audioAccomp.currentTime; };

// Volume controls
volVocals.oninput = () => { audioVocals.volume = volVocals.valueAsNumber; };
volAccomp.oninput = () => { audioAccomp.volume = volAccomp.valueAsNumber; };

// When one ends, stop both
audioVocals.onended = audioAccomp.onended = function() {
  audioVocals.pause();
  audioAccomp.pause();
  btnPlay.textContent = "Play";
  btnPlay.classList.remove("paused");
};

// Optional: Pre-load at start
audioVocals.load(); audioAccomp.load();

