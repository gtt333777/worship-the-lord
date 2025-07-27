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

function skipSeconds(delta) {
  const newTime = Math.max(0, vocalAudio.currentTime + delta);
  vocalAudio.currentTime = newTime;
  accompAudio.currentTime = newTime;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') skipSeconds(-1);
  if (e.key === 'ArrowRight') skipSeconds(1);
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

async function loadSongs() {
  await loadDropboxToken();
  const response = await fetch("lyrics/song_names.txt");
  const songNames = (await response.text()).split('\n').map(s => s.trim()).filter(Boolean);
  const select = document.getElementById("songSelect");
  songNames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  loadSong(songNames[0]);
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

  loops.forEach((loop, index) => {
    const xStart = loop.start * pxPerSec;
    const xEnd = loop.end * pxPerSec;
    ctx.fillStyle = "#e0b0ff";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.fillText(index + 1, xStart + 3, 15);
  });

  const progressX = vocalAudio.currentTime * pxPerSec;
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(progressX, 0);
  ctx.lineTo(progressX, height);
  ctx.stroke();
}

loopCanvas.addEventListener("click", e => {
  if (!vocalAudio.duration || !loops.length) return;
  const rect = loopCanvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const seconds = clickX * vocalAudio.duration / loopCanvas.width;

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
    }
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
  const prefix = name.trim();
  currentPrefix = prefix;
  const ext = "mp3";
  const vocalPath = `${DROPBOX_FOLDER}${prefix}_vocal.${ext}`;
  const accompPath = `${DROPBOX_FOLDER}${prefix}_acc.${ext}`;

  try {
    const [vocalURL, accompURL] = await Promise.all([
      getTemporaryLink(vocalPath),
      getTemporaryLink(accompPath)
    ]);

    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;

    vocalAudio.load();
    accompAudio.load();

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

    const loopPath = `${DROPBOX_FOLDER}${prefix}_loops.json`;
    try {
      const loopURL = await getTemporaryLink(loopPath);
      const loopRes = await fetch(loopURL);
      loops = await loopRes.json();
      activeLoopIndex = 0;
      vocalAudio.currentTime = loops[0].start;
      accompAudio.currentTime = loops[0].start;
    } catch (err) {
      loops = [];
      activeLoopIndex = -1;
      console.warn("No loop file for", prefix);
    }

  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => {
  loadSong(e.target.value);
});

document.getElementById("playBtn").addEventListener("click", () => {
  if (loops.length) {
    vocalAudio.currentTime = loops[activeLoopIndex >= 0 ? activeLoopIndex : 0].start;
    accompAudio.currentTime = vocalAudio.currentTime;
  }
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .catch(err => console.error("Playback error:", err));
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

// === 🔖 BOOKMARK LOGIC START ===

let songLoadCount = parseInt(localStorage.getItem("songLoadCount") || "0");

function updateSongLoadCount() {
  songLoadCount++;
  localStorage.setItem("songLoadCount", songLoadCount);
  if (songLoadCount % 10 === 0) {
    showBookmarkPrompt();
  }
}

function showBookmarkPrompt() {
  const prompt = document.getElementById("bookmarkPrompt");
  if (prompt) prompt.style.display = "block";
}

function dismissBookmark() {
  document.getElementById("bookmarkPrompt").style.display = "none";
}

function confirmBookmark() {
  populateExistingFolders();
  document.getElementById("bookmarkPrompt").style.display = "none";
  document.getElementById("bookmarkModal").style.display = "block";
}

function closeBookmarkModal() {
  document.getElementById("bookmarkModal").style.display = "none";
  document.getElementById("bookmarkStatus").textContent = "";
  document.getElementById("newFolderName").value = "";
}

function populateExistingFolders() {
  const folders = getBookmarkFolders();
  const dropdown = document.getElementById("existingFolders");
  dropdown.innerHTML = "";

  Object.keys(folders).forEach(folder => {
    const opt = document.createElement("option");
    opt.value = folder;
    opt.textContent = folder;
    dropdown.appendChild(opt);
  });

  if (!dropdown.options.length) {
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "My Bookmarks";
    defaultOpt.textContent = "My Bookmarks";
    dropdown.appendChild(defaultOpt);
  }
}

function getBookmarkFolders() {
  return JSON.parse(localStorage.getItem("bookmarks") || "{}");
}

function setBookmarkFolders(bookmarks) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

function saveBookmark() {
  const song = currentPrefix;
  const newFolder = document.getElementById("newFolderName").value.trim();
  const selectedFolder = document.getElementById("existingFolders").value;
  const folder = newFolder || selectedFolder;

  let bookmarks = getBookmarkFolders();
  if (!bookmarks[folder]) bookmarks[folder] = [];

  if (!bookmarks[folder].includes(song)) {
    bookmarks[folder].push(song);
    setBookmarkFolders(bookmarks);
    document.getElementById("bookmarkStatus").textContent = `✅ "${song}" added to "${folder}"`;
    updateStarIcon();
    setTimeout(closeBookmarkModal, 1000);
  } else {
    document.getElementById("bookmarkStatus").textContent = `✅ Already in "${folder}"`;
    setTimeout(closeBookmarkModal, 1000);
  }
}

function updateStarIcon() {
  const song = currentPrefix;
  const btn = document.getElementById("bookmarkBtn");
  const folders = getBookmarkFolders();
  const isBookmarked = Object.values(folders).some(list => list.includes(song));
  btn.textContent = isBookmarked ? "⭐️" : "☆";
}

document.getElementById("bookmarkBtn").addEventListener("click", () => {
  populateExistingFolders();
  document.getElementById("bookmarkModal").style.display = "block";
});

// Wrap and override loadSong to include bookmark updates
const originalLoadSong = loadSong;
loadSong = async function (name) {
  await originalLoadSong(name);
  updateStarIcon();
  updateSongLoadCount();
};

// === 🔖 BOOKMARK LOGIC END ===

loadSongs();
