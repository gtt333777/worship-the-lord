let ACCESS_TOKEN = "";

// ✅ Securely load Dropbox access token from Netlify serverless function
async function loadDropboxToken() {
  try {
    const res = await fetch('/.netlify/functions/getDropboxToken');
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
  } catch (err) {
    console.error("Failed to fetch Dropbox token:", err);
  }
}

const DROPBOX_FOLDER = "/WorshipSongs/";

let vocalAudio = new Audio();
let accompAudio = new Audio();

document.getElementById('vocalVolume').addEventListener('input', e => {
  vocalAudio.volume = parseFloat(e.target.value);
});
document.getElementById('accompVolume').addEventListener('input', e => {
  accompAudio.volume = parseFloat(e.target.value);
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(type === 'vocal' ? 'vocalVolume' : 'accompVolume');
  let vol = parseFloat(slider.value) + delta;
  vol = Math.min(1, Math.max(0, vol));
  slider.value = vol;
  if (type === 'vocal') vocalAudio.volume = vol;
  else accompAudio.volume = vol;
}

async function getTemporaryLink(path) {
  console.log("Trying to fetch from Dropbox path:", path);
  const response = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path })
  });
  if (!response.ok) throw new Error("Failed to get Dropbox link");
  const data = await response.json();
  return data.link;
}

// === ✅ [ ADDED ] Detect FLAC support for better quality ===
function supportsFlac() {
  const a = document.createElement('audio');
  return !!a.canPlayType && a.canPlayType('audio/flac; codecs="flac"') !== "";
}
// === ✅ [ END ADDED ] ===

// === ✅ [ LOOP DATA + PROGRESS BAR ] ===
let loops = [];
let activeLoopIndex = -1;
const canvas = document.getElementById("progressCanvas");
const ctx = canvas.getContext("2d");

function drawProgressBar() {
  if (!vocalAudio.duration || !loops.length) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pxPerSec = canvas.width / vocalAudio.duration;

  loops.forEach((loop, i) => {
    const xStart = loop.start * pxPerSec;
    const xEnd = loop.end * pxPerSec;
    ctx.fillStyle = i < activeLoopIndex ? "#8B4513" : (i === activeLoopIndex ? "#228B22" : "#FF6347");
    ctx.fillRect(xStart, 0, xEnd - xStart, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(i + 1, xStart + 4, canvas.height / 2 + 5);
  });

  // Draw current time marker
  const currentX = vocalAudio.currentTime * pxPerSec;
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(currentX, 0);
  ctx.lineTo(currentX, canvas.height);
  ctx.stroke();
}

canvas.addEventListener("click", (e) => {
  if (!vocalAudio.duration || !loops.length) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const clickedTime = (x / canvas.width) * vocalAudio.duration;

  const clickedIndex = loops.findIndex(loop => clickedTime >= loop.start && clickedTime <= loop.end);
  if (clickedIndex !== -1) {
    activeLoopIndex = clickedIndex;
    vocalAudio.currentTime = loops[activeLoopIndex].start;
    accompAudio.currentTime = loops[activeLoopIndex].start;
    Promise.all([vocalAudio.play(), accompAudio.play()]);
  }
});

function handleLoopPlayback() {
  if (activeLoopIndex >= 0 && activeLoopIndex < loops.length) {
    const loop = loops[activeLoopIndex];
    if (vocalAudio.currentTime >= loop.end) {
      activeLoopIndex++;
      if (activeLoopIndex < loops.length) {
        vocalAudio.currentTime = loops[activeLoopIndex].start;
        accompAudio.currentTime = loops[activeLoopIndex].start;
      } else {
        vocalAudio.pause();
        accompAudio.pause();
        activeLoopIndex = -1;
      }
    }
  }
  drawProgressBar();
}

vocalAudio.addEventListener("timeupdate", handleLoopPlayback);

// === ✅ [ END LOOP DATA ] ===

async function loadSongs() {
  await loadDropboxToken(); // ✅ Load Dropbox access token first
  const response = await fetch("lyrics/songs_names.txt");
  const songNames = (await response.text()).split('\n').map(s => s.trim()).filter(Boolean);
  const select = document.getElementById("songSelect");
  songNames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  // ✅✅ FIXED: Load first song correctly
  loadSong(songNames[0]);
}

async function loadSong(name) {
  const prefix = name.trim();

  const ext = supportsFlac() ? "flac" : "mp3";
  const vocalPath = `${DROPBOX_FOLDER}${prefix}_vocal.${ext}`;
  const accompPath = `${DROPBOX_FOLDER}${prefix}_acc.${ext}`;
  const loopsPath = `${DROPBOX_FOLDER}${prefix}_loops.json`;

  try {
    const [vocalURL, accompURL, loopsURL] = await Promise.all([
      getTemporaryLink(vocalPath),
      getTemporaryLink(accompPath),
      getTemporaryLink(loopsPath)
    ]);

    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;
    vocalAudio.load();
    accompAudio.load();

    // Fetch loop JSON
    const loopsRes = await fetch(loopsURL);
    loops = await loopsRes.json();
    activeLoopIndex = -1;

    // === ✅✅ Lyrics Load (unchanged) ===
    fetch(`lyrics/${prefix}.txt`)
      .then(res => res.ok ? res.text() : "Lyrics not found.")
      .then(txt => {
        const box = document.getElementById("lyricsBox");
        box.value = "";
        box.value = txt;
        box.scrollTop = 0;
      })
      .catch(err => {
        document.getElementById("lyricsBox").value = "Lyrics could not be loaded.";
        console.error("Lyrics load error:", err);
      });

  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => {
  loadSong(e.target.value);
});

document.getElementById("playBtn").addEventListener("click", () => {
  if (loops.length) {
    activeLoopIndex = 0;
    vocalAudio.currentTime = loops[0].start;
    accompAudio.currentTime = loops[0].start;
  }
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .catch(err => console.error("Playback error:", err));
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

loadSongs();
