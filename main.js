let songs = [];
let currentSong = null;

// Utility: Remove or replace illegal filename characters
function safeFileName(title) {
  return title.replace(/[\\/:*?"<>|]/g, "").trim();
}

async function loadSongs() {
  try {
    const resp = await fetch("songs.json");
    songs = await resp.json();
    const select = document.getElementById("songSelect");
    select.innerHTML = "";
    songs.forEach((s, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = s.title;
      select.appendChild(opt);
    });
    select.onchange = () => selectSong(select.value);
    selectSong(0);
  } catch (e) {
    document.getElementById("lyricsDiv").innerHTML = "<b>Could not load song list!</b>";
  }
}

async function selectSong(idx) {
  currentSong = songs[idx];
  document.getElementById("vocalAudio").src = currentSong.vocal;
  document.getElementById("accompAudio").src = currentSong.accompaniment;
  document.getElementById("vocalVol").value = 1;
  document.getElementById("accompVol").value = 1;
  updateVolume("vocal");
  updateVolume("accomp");
  loadLyrics(currentSong.title);
}

function setVolume(type, change) {
  const slider = document.getElementById(type === "vocal" ? "vocalVol" : "accompVol");
  let val = parseFloat(slider.value) + change;
  val = Math.max(0, Math.min(1, val));
  slider.value = val.toFixed(2);
  updateVolume(type);
}
function updateVolume(type) {
  const slider = document.getElementById(type === "vocal" ? "vocalVol" : "accompVol");
  const audio = document.getElementById(type === "vocal" ? "vocalAudio" : "accompAudio");
  audio.volume = parseFloat(slider.value);
}

// Play/Pause both
function playBoth() {
  document.getElementById("vocalAudio").play();
  document.getElementById("accompAudio").play();
}
function pauseBoth() {
  document.getElementById("vocalAudio").pause();
  document.getElementById("accompAudio").pause();
}

// === LYRICS LOADING LOGIC ===

async function loadLyrics(songTitle) {
  const baseName = safeFileName(songTitle);
  const tryExtensions = [".txt", ".pdf", ".docx", ".xlsx"];
  const folder = "lyrics/";
  let found = false;

  for (let ext of tryExtensions) {
    const url = folder + baseName + ext;
    try {
      // Try .txt directly and show inside app
      if (ext === ".txt") {
        const resp = await fetch(url);
        if (resp.ok) {
          const txt = await resp.text();
          document.getElementById("lyricsDiv").innerHTML = txt.replace(/\n/g, "<br>");
          found = true;
          break;
        }
      } else {
        // For pdf, docx, xlsx: check if file exists, and if so, offer download link
        const head = await fetch(url, { method: "HEAD" });
        if (head.ok) {
          document.getElementById("lyricsDiv").innerHTML = `
            <b>Lyrics file available as ${ext.slice(1).toUpperCase()}:</b>
            <br>
            <a href="${url}" target="_blank">Open ${baseName + ext}</a>
            <br><i>Cannot display this format inside the app.<br>Click link above to view or download.</i>
          `;
          found = true;
          break;
        }
      }
    } catch (e) { /* Try next */ }
  }
  if (!found) {
    document.getElementById("lyricsDiv").innerHTML = "<i>Lyrics not found.</i>";
  }
}

// Initial load
window.onload = loadSongs;
