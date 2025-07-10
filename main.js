let songs = [];
let currentSongIndex = 0;

function fetchSongs() {
  fetch('songs.json')
    .then(res => res.json())
    .then(data => {
      songs = data;
      populateSongSelect();
      if (songs.length > 0) {
        loadSong(0);
      }
    });
}

function populateSongSelect() {
  const select = document.getElementById('songSelect');
  select.innerHTML = '';
  songs.forEach((song, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = song.title;
    select.appendChild(opt);
  });
  select.addEventListener('change', e => {
    loadSong(Number(e.target.value));
  });
}

function loadSong(idx) {
  currentSongIndex = idx;
  const song = songs[idx];
  // Build player UI
  document.getElementById('playerSection').innerHTML = `
    <h2>${song.title}</h2>
    <button onclick="playBoth()">&#9658; Play</button>
    Vocal: <button onclick="setVolume('vocal', -0.1)">-</button>
    <span id="vocalVol">100%</span>
    <button onclick="setVolume('vocal', 0.1)">+</button>
    Music: <button onclick="setVolume('accompaniment', -0.1)">-</button>
    <span id="musicVol">100%</span>
    <button onclick="setVolume('accompaniment', 0.1)">+</button>
    <audio id="vocalPlayer" src="${song.vocal}" preload="auto"></audio>
    <audio id="accompanimentPlayer" src="${song.accompaniment}" preload="auto"></audio>
  `;

  // Lyrics section
  document.getElementById('lyricsSection').innerHTML = `
    <div>
      <b>Lyrics:</b> 
      <a href="${song.lyrics_pdf}" target="_blank">Open Lyrics PDF</a>
    </div>
  `;

  window.vocalVol = 1;
  window.musicVol = 1;
}

function playBoth() {
  const v = document.getElementById('vocalPlayer');
  const m = document.getElementById('accompanimentPlayer');
  v.currentTime = 0; m.currentTime = 0;
  v.volume = window.vocalVol || 1;
  m.volume = window.musicVol || 1;
  v.play(); m.play();
}

function setVolume(which, delta) {
  if (which === 'vocal') {
    window.vocalVol = Math.max(0, Math.min(1, (window.vocalVol || 1) + delta));
    document.getElementById('vocalPlayer').volume = window.vocalVol;
    document.getElementById('vocalVol').textContent = Math.round(window.vocalVol*100) + '%';
  } else {
    window.musicVol = Math.max(0, Math.min(1, (window.musicVol || 1) + delta));
    document.getElementById('accompanimentPlayer').volume = window.musicVol;
    document.getElementById('musicVol').textContent = Math.round(window.musicVol*100) + '%';
  }
}

window.onload = fetchSongs;
