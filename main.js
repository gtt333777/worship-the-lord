let songs = [];
let songTitles = [];
const supportedLyricExts = ['.txt', '.pdf', '.docx', '.xlsx'];

fetch('songs.json')
  .then(r => r.json())
  .then(data => {
    songs = data;
    songTitles = songs.map(song => song.title);
    fillSongDropdown();
    onSongChange();
  });

function fillSongDropdown() {
  const sel = document.getElementById('songSelect');
  sel.innerHTML = '';
  songTitles.forEach((t, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = t;
    sel.appendChild(opt);
  });
  sel.onchange = onSongChange;
}

function getLyricsBaseName(title) {
  // Remove special chars/spaces and lowercase for robust match
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function onSongChange() {
  const idx = document.getElementById('songSelect').value;
  const song = songs[idx];
  document.getElementById('vocalAudio').src = song.vocal;
  document.getElementById('accompAudio').src = song.accompaniment;
  loadLyrics(song.title);
}

function playBoth() {
  document.getElementById('vocalAudio').play();
  document.getElementById('accompAudio').play();
}
function pauseBoth() {
  document.getElementById('vocalAudio').pause();
  document.getElementById('accompAudio').pause();
}
function setVolume(which, delta) {
  const id = which === 'vocal' ? 'vocalVol' : 'accompVol';
  const vol = document.getElementById(id);
  let v = Math.max(0, Math.min(1, Number(vol.value) + delta));
  vol.value = v.toFixed(2);
  updateVolume(which);
}
function updateVolume(which) {
  const v = Number(document.getElementById(which === 'vocal' ? 'vocalVol' : 'accompVol').value);
  document.getElementById(which === 'vocal' ? 'vocalAudio' : 'accompAudio').volume = v;
}

// --- Lyrics logic ---
async function loadLyrics(title) {
  const div = document.getElementById('lyricsDiv');
  div.innerHTML = "<i>Loading lyrics...</i>";
  const base = getLyricsBaseName(title);
  // Try .txt first, then .pdf, .docx, .xlsx
  let found = false;
  for (const ext of supportedLyricExts) {
    const url = `lyrics/${base}${ext}`;
    try {
      if (ext === '.txt') {
        let resp = await fetch(url);
        if (resp.ok) {
          let txt = await resp.text();
          div.innerHTML = txt.replace(/\n/g, "<br>");
          found = true;
          break;
        }
      } else {
        // Try HEAD request to see if file exists
        let resp = await fetch(url, { method: 'HEAD' });
        if (resp.ok) {
          div.innerHTML = `<a href="${url}" target="_blank" style="font-size:1.1em">View Lyrics (${ext.slice(1).toUpperCase()})</a>`;
          found = true;
          break;
        }
      }
    } catch (e) {}
  }
  if (!found) {
    div.innerHTML = "<span style='color:#888'>No lyrics found for this song.</span>";
  }
}
