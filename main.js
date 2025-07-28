let ACCESS_TOKEN = "";

async function loadDropboxToken() {
  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
  } catch (err) {
    console.error("Failed to fetch Dropbox token:", err);
  }
}

const DROPBOX_FOLDER = "/WorshipSongs/";
let vocalAudio = new Audio();
let accompAudio = new Audio();

["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("input", e => {
    (type === "vocal" ? vocalAudio : accompAudio).volume = parseFloat(e.target.value);
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  let vol = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
  slider.value = vol;
  (type === "vocal" ? vocalAudio : accompAudio).volume = vol;
}

function skipSeconds(delta) {
  const newTime = Math.max(0, vocalAudio.currentTime + delta);
  vocalAudio.currentTime = newTime;
  accompAudio.currentTime = newTime;
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") skipSeconds(-1);
  if (e.key === "ArrowRight") skipSeconds(1);
});

async function getTemporaryLink(path) {
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

let loops = [];
let activeLoopIndex = 0;
const loopCanvas = document.getElementById("loopCanvas");
const ctx = loopCanvas.getContext("2d");
let currentPrefix = "";

function drawLoops(duration) {
  ctx.clearRect(0, 0, loopCanvas.width, loopCanvas.height);
  if (!loops.length || !duration) return;
  const width = loopCanvas.width;
  const height = loopCanvas.height;
  const pxPerSec = width / duration;
  loops.forEach((loop, i) => {
    const xStart = loop.start * pxPerSec;
    const xEnd = loop.end * pxPerSec;
    ctx.fillStyle = "#e0b0ff";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.fillStyle = "#333";
    ctx.fillText(i + 1, xStart + 3, 15);
  });
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(vocalAudio.currentTime * pxPerSec, 0);
  ctx.lineTo(vocalAudio.currentTime * pxPerSec, height);
  ctx.stroke();
}

// 🔁 LOOP-ONLY MODE: Click inside a loop to start from its beginning and continue till end
loopCanvas.addEventListener("click", e => {
  if (!vocalAudio.duration || !loops.length) return;

  const rect = loopCanvas.getBoundingClientRect();
  const seconds = (e.clientX - rect.left) * vocalAudio.duration / loopCanvas.width;

  const clickedIndex = loops.findIndex(loop => seconds >= loop.start && seconds <= loop.end);
  if (clickedIndex >= 0) {
    activeLoopIndex = clickedIndex;
    const startTime = loops[activeLoopIndex].start;
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;
    vocalAudio.play();
    accompAudio.play();
  }

  // 🚫 No else block — clicking outside a loop does nothing
})

vocalAudio.addEventListener("timeupdate", () => {
  drawLoops(vocalAudio.duration);
  if (activeLoopIndex >= 0 && loops.length) {
    const loop = loops[activeLoopIndex];
    if (vocalAudio.currentTime < loop.start) {
      vocalAudio.currentTime = loop.start;
      accompAudio.currentTime = loop.start;
    } else if (vocalAudio.currentTime >= loop.end) {
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
});

async function loadSong(name) {
  const prefix = name.trim();
  currentPrefix = prefix;
  const ext = "mp3";
  try {
    const [vocalURL, accompURL] = await Promise.all([
      getTemporaryLink(`${DROPBOX_FOLDER}${prefix}_vocal.${ext}`),
      getTemporaryLink(`${DROPBOX_FOLDER}${prefix}_acc.${ext}`)
    ]);
    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;
    vocalAudio.load();
    accompAudio.load();
    document.getElementById("lyricsBox").value = "Loading...";
    const lyrics = await fetch(`lyrics/${prefix}.txt`).then(r => r.ok ? r.text() : "Lyrics not found");
    document.getElementById("lyricsBox").value = lyrics;
    try {
      const loopURL = await getTemporaryLink(`${DROPBOX_FOLDER}${prefix}_loops.json`);
      loops = await (await fetch(loopURL)).json();
      activeLoopIndex = 0;
    } catch {
      loops = [];
      activeLoopIndex = -1;
    }
    updateBookmarkStar();
  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => loadSong(e.target.value));
// 🔁 LOOP-ONLY MODE: Play button always starts from first loop
document.getElementById("playBtn").addEventListener("click", () => {
  if (loops.length) {
    activeLoopIndex = 0;
    const start = loops[0].start;
    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;
    Promise.all([vocalAudio.play(), accompAudio.play()]).catch(console.error);
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

function getBookmarkFolders() {
  return JSON.parse(localStorage.getItem("bookmarks") || "{}");
}

function setBookmarkFolders(data) {
  localStorage.setItem("bookmarks", JSON.stringify(data));
}

function populateBookmarkedDropdown() {
  const folderData = getBookmarkFolders();
  const select = document.getElementById("bookmarkDropdown");
  select.innerHTML = '<option value="">🎯 Bookmarked Songs</option>';
  for (let i = 1; i <= 5; i++) {
    const folder = `Favorites ${i}`;
    if (folderData[folder]?.length) {
      const group = document.createElement("optgroup");
      group.label = folder;
      folderData[folder].forEach(song => {
        const opt = document.createElement("option");
        opt.value = song;
        opt.textContent = song;
        group.appendChild(opt);
      });
      select.appendChild(group);
    }
  }
  select.addEventListener("change", e => {
    if (e.target.value) loadSong(e.target.value);
  });
}

function updateBookmarkStar() {
  const starBtn = document.getElementById("bookmarkBtn");
  const folders = getBookmarkFolders();
  const normalizedPrefix = currentPrefix.trim();
  let isBookmarked = false;
  for (const list of Object.values(folders)) {
    if (list.some(song => song.trim() === normalizedPrefix)) {
      isBookmarked = true;
      break;
    }
  }
  starBtn.textContent = isBookmarked ? "⭐" : "☆";
}


document.getElementById("bookmarkBtn").addEventListener("click", () => {
  const folders = getBookmarkFolders();
  const allFolders = Array.from({ length: 5 }, (_, i) => `Favorites ${i + 1}`);
  const list = allFolders.map(f => {
    const songs = folders[f]?.join(", ") || "(none)";
    return `${f}: ${songs}`;
  }).join("\n");

  const folderChoice = prompt(`Select folder:\n\n${list}`, allFolders[0]);
  if (!folderChoice || !allFolders.includes(folderChoice)) return;

  if (!folders[folderChoice]) folders[folderChoice] = [];

  const normalizedPrefix = currentPrefix.trim();
  const alreadyBookmarked = folders[folderChoice].some(x => x.trim() === normalizedPrefix);

  if (alreadyBookmarked) {
    folders[folderChoice] = folders[folderChoice].filter(x => x.trim() !== normalizedPrefix);
  } else {
    folders[folderChoice].push(currentPrefix);
  }

  setBookmarkFolders(folders);
  populateBookmarkedDropdown();
  updateBookmarkStar(); // ✅ Fixes icon update
});

async function loadSongs() {
  await loadDropboxToken();
  const txt = await fetch("lyrics/song_names.txt").then(r => r.text());
  const names = txt.split("\n").map(x => x.trim()).filter(Boolean);
  const select = document.getElementById("songSelect");
  names.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  populateBookmarkedDropdown();
  loadSong(names[0]);
}

loadSongs();

// ✅ PWA install prompt control (optional, duplicate safeguard — also present in index.html)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(console.error);
}