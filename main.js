let songs = [];
let currentSong = null;

async function loadSongs() {
  const resp = await fetch('songs.json');
  songs = await resp.json();

  const songSelect = document.getElementById('songSelect');
  songSelect.innerHTML = "";
  songs.forEach((song, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = song.title;
    songSelect.appendChild(opt);
  });

  songSelect.onchange = onSongChange;
  onSongChange();
}

function onSongChange() {
  const idx = document.getElementById('songSelect').value;
  currentSong = songs[idx];
  setAudio();
  loadLyrics();
}

function setAudio() {
  document.getElementById('vocalAudio').src = currentSong.vocal;
  document.getElementById('accompAudio').src = currentSong.accompaniment;
  document.getElementById('vocalVol').value = 1;
  document.getElementById('accompVol').value = 1;
  updateVolume('vocal');
  updateVolume('accomp');
}

function playBoth() {
  document.getElementById('vocalAudio').play();
  document.getElementById('accompAudio').play();
}
function pauseBoth() {
  document.getElementById('vocalAudio').pause();
  document.getElementById('accompAudio').pause();
}
function setVolume(type, delta) {
  const slider = document.getElementById(type === 'vocal' ? 'vocalVol' : 'accompVol');
  let v = parseFloat(slider.value) + delta;
  v = Math.max(0, Math.min(1, v));
  slider.value = v;
  updateVolume(type);
}
function updateVolume(type) {
  const audio = document.getElementById(type === 'vocal' ? 'vocalAudio' : 'accompAudio');
  const slider = document.getElementById(type === 'vocal' ? 'vocalVol' : 'accompVol');
  audio.volume = parseFloat(slider.value);
}

// Get lyrics file base name from the song title (normalized for Unicode filenames)
function normalizeFileBase(title) {
  return title
    .normalize('NFC')    // Unicode normalize (important for Tamil, etc)
    .replace(/[\\/:*?"<>|]/g, '') // Remove invalid file chars
    .trim();
}

// Try lyrics/SONG.txt, .pdf, .docx, .xlsx (prioritizing .txt, as in your test)
async function loadLyrics() {
  const div = document.getElementById('lyricsDiv');
  div.innerHTML = "<i>Loading lyrics...</i>";
  const title = currentSong.title;
  const base = normalizeFileBase(title);

  // Try different extensions in order
  const exts = ['.txt', '.pdf', '.docx', '.xlsx'];
  for (const ext of exts) {
    try {
      const url = `lyrics/${base}${ext}`;
      if (ext === '.txt') {
        const resp = await fetch(url);
        if (resp.ok) {
          let txt = await resp.text();
          txt = txt.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
          div.innerHTML = `<b>${title}</b><br><br>${txt}`;
          return;
        }
      }
      // For .pdf, .docx, .xlsx just offer a download/view link if file exists
      else {
        const resp = await fetch(url, { method: 'HEAD' });
        if (resp.ok) {
          let label = ext.slice(1).toUpperCase();
          div.innerHTML = `
            <b>${title}</b><br><br>
            <a href="${url}" target="_blank">Open Lyrics (${label})</a>
          `;
          return;
        }
      }
    } catch (e) {}
  }
  div.innerHTML = "<i>Lyrics not found.</i>";
}

window.onload = loadSongs;
