let songs = [];
const songSelect = document.getElementById('songSelect');
const playerArea = document.getElementById('playerArea');

// Load songs.json
fetch('songs.json')
  .then(res => res.json())
  .then(data => {
    songs = data;
    fillSongList();
    showSong(0); // Show first song by default
  });

function fillSongList() {
  songSelect.innerHTML = "";
  songs.forEach((song, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = song.title;
    songSelect.appendChild(opt);
  });
  songSelect.onchange = () => showSong(songSelect.value);
}

function showSong(idx) {
  if (songs.length === 0) return;
  const song = songs[idx];
  playerArea.innerHTML = `
    <h2 style="margin:10px 0 8px 0;">${song.title}</h2>
    <div class="controls">
      <button id="playBtn">Play</button>
      Vocal <button id="vdown">-</button> <span id="vvol">100</span>% <button id="vup">+</button>
      Music <button id="mdown">-</button> <span id="mvol">100</span>% <button id="mup">+</button>
    </div>
    <audio id="vocal" src="${song.vocal}" preload="none"></audio>
    <audio id="music" src="${song.music}" preload="none"></audio>
    <div style="margin-top:18px;">
      <div style="font-size:1.15em;margin-bottom:5px;">Lyrics:</div>
      <iframe class="lyrics-frame" src="${song.lyrics}"></iframe>
    </div>
  `;
  const vocal = playerArea.querySelector('#vocal');
  const music = playerArea.querySelector('#music');
  let vvol = 1, mvol = 1;
  document.getElementById('playBtn').onclick = function() {
    if (vocal.paused && music.paused) {
      vocal.currentTime = 0; music.currentTime = 0;
      vocal.volume = vvol; music.volume = mvol;
      vocal.play(); music.play();
      this.textContent = 'Pause';
    } else {
      vocal.pause(); music.pause();
      this.textContent = 'Play';
    }
  };
  document.getElementById('vdown').onclick = () => setVol('v', Math.max(0, vvol - 0.05));
  document.getElementById('vup').onclick = () => setVol('v', Math.min(1, vvol + 0.05));
  document.getElementById('mdown').onclick = () => setVol('m', Math.max(0, mvol - 0.05));
  document.getElementById('mup').onclick = () => setVol('m', Math.min(1, mvol + 0.05));
  function setVol(type, value) {
    if (type === 'v') {
      vvol = value; vocal.volume = vvol;
      document.getElementById('vvol').textContent = Math.round(vvol*100);
    }
    if (type === 'm') {
      mvol = value; music.volume = mvol;
      document.getElementById('mvol').textContent = Math.round(mvol*100);
    }
  }
}
