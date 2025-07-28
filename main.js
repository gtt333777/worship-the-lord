// === GOLD STANDARD MAIN.JS (Only Bookmark Star Toggle Logic Updated) ===

let ACCESS_TOKEN = "";
let vocalAudio = new Audio();
let accompAudio = new Audio();
const DROPBOX_FOLDER = "/WorshipSongs/";

document.getElementById("vocalVolume").addEventListener("input", e => {
  vocalAudio.volume = parseFloat(e.target.value);
});
document.getElementById("accompVolume").addEventListener("input", e => {
  accompAudio.volume = parseFloat(e.target.value);
});
function adjustVolume(type, delta) {
  const el = document.getElementById(type + "Volume");
  el.value = Math.min(1, Math.max(0, parseFloat(el.value) + delta));
  (type === "vocal" ? vocalAudio : accompAudio).volume = parseFloat(el.value);
}
function skipSeconds(sec) {
  vocalAudio.currentTime += sec;
  accompAudio.currentTime += sec;
}
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") skipSeconds(-1);
  else if (e.key === "ArrowRight") skipSeconds(1);
});

async function loadDropboxToken() {
  const res = await fetch('/.netlify/functions/getDropboxToken');
  const data = await res.json();
  ACCESS_TOKEN = data.access_token;
}
async function getTemporaryLink(path) {
  const res = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path })
  });
  const data = await res.json();
  return data.link;
}

let loops = [];
let activeLoopIndex = -1;
let currentPrefix = "";
const canvas = document.getElementById("loopCanvas");
const ctx = canvas.getContext("2d");

function drawLoops(duration) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!duration || !loops.length) return;
  const pxPerSec = canvas.width / duration;
  loops.forEach((loop, idx) => {
    const x1 = loop.start * pxPerSec;
    const x2 = loop.end * pxPerSec;
    ctx.fillStyle = "#e0b0ff";
    ctx.fillRect(x1, 0, x2 - x1, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillText((idx + 1).toString(), x1 + 3, 15);
  });
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  const x = vocalAudio.currentTime * pxPerSec;
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
}
canvas.addEventListener("click", e => {
  if (!vocalAudio.duration || !loops.length) return;
  const seconds = (e.offsetX / canvas.width) * vocalAudio.duration;
  const found = loops.findIndex(loop => seconds >= loop.start && seconds <= loop.end);
  if (found >= 0) {
    activeLoopIndex = found;
    vocalAudio.currentTime = loops[found].start;
    accompAudio.currentTime = loops[found].start;
    vocalAudio.play();
    accompAudio.play();
  }
});
vocalAudio.addEventListener("timeupdate", () => {
  drawLoops(vocalAudio.duration);
  if (activeLoopIndex >= 0 && loops.length) {
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
});

async function loadSong(name) {
  currentPrefix = name;
  try {
    const [vocalURL, accompURL] = await Promise.all([
      getTemporaryLink(`${DROPBOX_FOLDER}${name}_vocal.mp3`),
      getTemporaryLink(`${DROPBOX_FOLDER}${name}_acc.mp3`)
    ]);
    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;
    vocalAudio.load();
    accompAudio.load();
    document.getElementById("lyricsBox").value = "Loading...";
    const lyrics = await fetch(`lyrics/${name}.txt`).then(r => r.ok ? r.text() : "Lyrics not found");
    document.getElementById("lyricsBox").value = lyrics;
    try {
      const loopURL = await getTemporaryLink(`${DROPBOX_FOLDER}${name}_loops.json`);
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
document.getElementById("playBtn").addEventListener("click", () => {
  if (loops.length && activeLoopIndex >= 0) {
    const t = loops[activeLoopIndex].start;
    vocalAudio.currentTime = t;
    accompAudio.currentTime = t;
  }
  Promise.all([vocalAudio.play(), accompAudio.play()]).catch(console.error);
});
document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

function getBookmarkFolders() {
  return JSON.parse(localStorage.getItem("bookmarks") || "{}");
}
function saveBookmarkFolders(data) {
  localStorage.setItem("bookmarks", JSON.stringify(data));
}

function updateBookmarkStar() {
  const data = getBookmarkFolders();
  let found = false;
  for (const folder in data) {
    if (data[folder].includes(currentPrefix)) {
      found = true;
      break;
    }
  }
  document.getElementById("bookmarkBtn").textContent = found ? "⭐" : "☆";
}

function populateBookmarkedDropdown() {
  const data = getBookmarkFolders();
  const select = document.getElementById("bookmarkDropdown");
  select.innerHTML = '<option value="">🎯 Bookmarked Songs</option>';
  const sortedFolders = Object.keys(data).filter(f => data[f].length).sort((a, b) => {
    const fa = parseInt(a.split(" ")[1] || 0);
    const fb = parseInt(b.split(" ")[1] || 0);
    return fa - fb;
  });
  sortedFolders.forEach(folder => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = folder;
    data[folder].forEach(song => {
      const opt = document.createElement("option");
      opt.value = song;
      opt.textContent = song;
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  });
}

document.getElementById("bookmarkBtn").addEventListener("click", () => {
  const data = getBookmarkFolders();
  const isBookmarked = Object.values(data).some(songs => songs.includes(currentPrefix));
  if (!isBookmarked) {
    const folder = prompt("Add to which Favorites? (Favorites 1–5)");
    if (!folder) return;
    data[folder] = data[folder] || [];
    if (!data[folder].includes(currentPrefix)) data[folder].push(currentPrefix);
    saveBookmarkFolders(data);
    populateBookmarkedDropdown();
    updateBookmarkStar();
  } else {
    const allFolders = Object.entries(data).filter(([_, songs]) => songs.includes(currentPrefix));
    if (!allFolders.length) return;
    let menu = "Select folder to remove bookmark:\n";
    allFolders.forEach(([f], i) => menu += `${i + 1}. ${f}\n`);
    const choice = prompt(menu)?.trim();
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < allFolders.length) {
      const folder = allFolders[idx][0];
      data[folder] = data[folder].filter(s => s !== currentPrefix);
      if (data[folder].length === 0) delete data[folder];
      saveBookmarkFolders(data);
      populateBookmarkedDropdown();
      updateBookmarkStar();
    }
  }
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
