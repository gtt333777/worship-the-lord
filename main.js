let ACCESS_TOKEN = "";

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

loopCanvas.addEventListener("click", e => {
  if (!vocalAudio.duration || !loops.length) return;
  const rect = loopCanvas.getBoundingClientRect();
  const seconds = (e.clientX - rect.left) * vocalAudio.duration / loopCanvas.width;
  const clickedIndex = loops.findIndex(loop => seconds >= loop.start && seconds <= loop.end);
  if (clickedIndex >= 0) {
    activeLoopIndex = clickedIndex;
    vocalAudio.currentTime = loops[activeLoopIndex].start;
    accompAudio.currentTime = loops[activeLoopIndex].start;
    vocalAudio.play();
    accompAudio.play();
  }
});

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

function getBookmarkFolders() {
  return JSON.parse(localStorage.getItem("bookmarks") || "{}");
}

function saveBookmarks(data) {
  localStorage.setItem("bookmarks", JSON.stringify(data));
}

function isBookmarked(prefix) {
  const folders = getBookmarkFolders();
  return Object.values(folders).some(songs => songs.includes(prefix));
}

function updateBookmarkStar(prefix) {
  const btn = document.getElementById("bookmarkBtn");
  btn.textContent = isBookmarked(prefix) ? "⭐" : "☆";
}

function toggleBookmark(prefix) {
  const bookmarks = getBookmarkFolders();
  let currentFolder = "";

  // Check if already bookmarked
  for (const folder in bookmarks) {
    if (bookmarks[folder].includes(prefix)) {
      // Remove from folder
      bookmarks[folder] = bookmarks[folder].filter(s => s !== prefix);
      if (bookmarks[folder].length === 0) delete bookmarks[folder];
      saveBookmarks(bookmarks);
      populateBookmarkedDropdown();
      updateBookmarkStar(prefix);
      return;
    }
  }

  // Not bookmarked, ask where to add
  const folder = prompt("Add to which Favorites folder? (1–5)", "1");
  if (!folder || !["1", "2", "3", "4", "5"].includes(folder.trim())) return;

  const folderName = `Favorites ${folder}`;
  if (!bookmarks[folderName]) bookmarks[folderName] = [];
  if (!bookmarks[folderName].includes(prefix)) {
    bookmarks[folderName].push(prefix);
  }

  saveBookmarks(bookmarks);
  populateBookmarkedDropdown();
  updateBookmarkStar(prefix);
}

function populateBookmarkedDropdown() {
  const folderData = getBookmarkFolders();
  const select = document.getElementById("bookmarkDropdown");
  select.innerHTML = '<option value="">🎯 Bookmarked Songs</option>';

  // Sort folders by Favorites 1–5
  const folderOrder = ["Favorites 1", "Favorites 2", "Favorites 3", "Favorites 4", "Favorites 5"];
  folderOrder.forEach(folder => {
    if (folderData[folder] && folderData[folder].length) {
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
  });
}

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
    updateBookmarkStar(prefix);
  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => loadSong(e.target.value));
document.getElementById("bookmarkDropdown").addEventListener("change", e => {
  if (e.target.value) loadSong(e.target.value);
});
document.getElementById("bookmarkBtn").addEventListener("click", () => toggleBookmark(currentPrefix));
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
