// === Dropbox Token Loading ===
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

// === Constants ===
const DROPBOX_FOLDER = "/WorshipSongs/";
let vocalAudio = new Audio();
let accompAudio = new Audio();

// === Volume Controls ===
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

// === Dropbox File Link ===
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

// === Song Loading ===
let currentPrefix = "";
let segments = [];

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

    // Load lyrics
    document.getElementById("lyricsBox").value = "Loading...";
    const lyrics = await fetch(`lyrics/${prefix}.txt`).then(r => r.ok ? r.text() : "Lyrics not found");
    document.getElementById("lyricsBox").value = lyrics;

    // Load segments from local folder
    try {
      segments = await fetch(`lyrics/${prefix}_loops.json`).then(r => r.json());
    } catch {
      segments = [];
    }
    showSegmentButtons();
    updateBookmarkStar();
  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

function showSegmentButtons() {
  const container = document.getElementById("segments");
  container.innerHTML = "";
  if (!segments.length) return;
  segments.forEach((seg, i) => {
    const btn = document.createElement("button");
    btn.className = "segment-button";
    btn.textContent = `Segment ${i + 1}`;
    btn.onclick = () => {
      vocalAudio.currentTime = seg.start;
      accompAudio.currentTime = seg.start;
      vocalAudio.play();
      accompAudio.play();
    };
    container.appendChild(btn);
  });
}

// === Playback Buttons ===
document.getElementById("songSelect").addEventListener("change", e => loadSong(e.target.value));
document.getElementById("playBtn").addEventListener("click", () => {
  vocalAudio.play();
  accompAudio.play();
});
document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

// === Bookmark Logic ===
function getBookmarkFolders() {
  return JSON.parse(localStorage.getItem("bookmarks") || "{}");
}

function setBookmarkFolders(data) {
  localStorage.setItem("bookmarks", JSON.stringify(data));
}

function populateBookmarkedDropdown() {
  const folderData = getBookmarkFolders();
  const select = document.getElementById("bookmarkDropdown");
  select.innerHTML = '<option value="">\uD83C\uDFAF Bookmarked Songs</option>';
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
  updateBookmarkStar();
});

// === Initialization ===
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
