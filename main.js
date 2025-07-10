let songs = [];
let currentSong = null;

fetch("songs.json")
  .then(res => res.json())
  .then(data => {
    songs = data;
    populateSongs();
    if (songs.length > 0) selectSong(0);
  });

function populateSongs() {
  const sel = document.getElementById("songSelect");
  sel.innerHTML = '';
  songs.forEach((s, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.innerText = s.title;
    sel.appendChild(opt);
  });
  sel.onchange = e => selectSong(e.target.value);
}

function selectSong(idx) {
  currentSong = songs[idx];
  document.getElementById("vocalAudio").src = currentSong.vocal;
  document.getElementById("accompAudio").src = currentSong.accompaniment;
  document.getElementById("vocalVol").value = 1;
  document.getElementById("accompVol").value = 1;
  updateVolume('vocal');
  updateVolume('accomp');
  loadLyrics(currentSong.title);
}

function playBoth() {
  document.getElementById("vocalAudio").play();
  document.getElementById("accompAudio").play();
}
function pauseBoth() {
  document.getElementById("vocalAudio").pause();
  document.getElementById("accompAudio").pause();
}
function setVolume(type, delta) {
  const el = document.getElementById(type === 'vocal' ? "vocalVol" : "accompVol");
  let val = parseFloat(el.value) + delta;
  val = Math.max(0, Math.min(1, val));
  el.value = val;
  updateVolume(type);
}
function updateVolume(type) {
  const val = document.getElementById(type === 'vocal' ? "vocalVol" : "accompVol").value;
  document.getElementById(type === 'vocal' ? "vocalAudio" : "accompAudio").volume = val;
}

// Support .txt, .pdf, .docx, .xlsx (lowercase, same prefix as song title)
async function loadLyrics(title) {
  const base = "lyrics/" + title.toLowerCase().replace(/\s+/g, "_");
  const lyricsDiv = document.getElementById("lyricsDiv");
  lyricsDiv.innerHTML = "<i>Loading lyrics...</i>";
  // .txt
  try {
    let txt = await fetch(base + ".txt").then(r => r.ok ? r.text() : null);
    if (txt) {
      lyricsDiv.innerHTML = "<pre style='font-family:inherit;font-size:1.15em;white-space:pre-wrap;'>" + txt + "</pre>";
      return;
    }
  } catch {}
  // .pdf
  let pdfUrl = base + ".pdf";
  if (await checkFileExists(pdfUrl)) {
    lyricsDiv.innerHTML = `
      <iframe src="${pdfUrl}" class="lyrics-viewer"></iframe>
      <a class="lyrics-link" href="${pdfUrl}" target="_blank">Open Lyrics PDF in New Window</a>
    `;
    return;
  }
  // .docx
  let docxUrl = base + ".docx";
  if (await checkFileExists(docxUrl)) {
    lyricsDiv.innerHTML = `
      <a class="lyrics-link" href="${docxUrl}" target="_blank">Open Lyrics DOCX</a>
    `;
    return;
  }
  // .xlsx
  let xlsxUrl = base + ".xlsx";
  if (await checkFileExists(xlsxUrl)) {
    lyricsDiv.innerHTML = `
      <a class="lyrics-link" href="${xlsxUrl}" target="_blank">Open Lyrics XLSX</a>
    `;
    return;
  }
  lyricsDiv.innerHTML = "<i>Lyrics not found.</i>";
}

async function checkFileExists(url) {
  try {
    let res = await fetch(url, {method:'HEAD'});
    return res.ok;
  } catch { return false; }
}
