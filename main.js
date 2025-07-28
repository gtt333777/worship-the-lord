// === Configuration ===
const DROPBOX_REFRESH_TOKEN = "YOUR_DROPBOX_REFRESH_TOKEN_HERE"; // Replace if needed
const DROPBOX_APP_KEY = "YOUR_DROPBOX_APP_KEY_HERE";
const DROPBOX_APP_SECRET = "YOUR_DROPBOX_APP_SECRET_HERE";
const DROPBOX_API_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_FOLDER = "/WorshipSongs/";

// === Globals ===
let accessToken = "";
let vocalAudio = new Audio();
let accompAudio = new Audio();
let currentPrefix = "";

// === 1. Get short-lived access token ===
async function getAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", DROPBOX_REFRESH_TOKEN);

  const auth = btoa(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`);
  const res = await fetch(DROPBOX_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await res.json();
  accessToken = data.access_token;
}

// === 2. Fetch temporary Dropbox file link ===
async function getDropboxLink(filePath) {
  const res = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: filePath }),
  });
  const data = await res.json();
  return data.link;
}

// === 3. Load and play selected song ===
async function loadSong(songName) {
  currentPrefix = songName;
  try {
    const vocalLink = await getDropboxLink(`${DROPBOX_FOLDER}${songName}_vocal.mp3`);
    const accLink = await getDropboxLink(`${DROPBOX_FOLDER}${songName}_acc.mp3`);
    vocalAudio.src = vocalLink;
    accompAudio.src = accLink;
    vocalAudio.load();
    accompAudio.load();

    const lyricsRes = await fetch(`lyrics/${songName}.txt`);
    const lyrics = await lyricsRes.text();
    document.getElementById("lyricsBox").value = lyrics;
  } catch (err) {
    alert("Failed to load song: " + err.message);
  }
}

// === 4. Volume control ===
function adjustVolume(type, delta) {
  const audio = type === "vocal" ? vocalAudio : accompAudio;
  const slider = document.getElementById(`${type}Volume`);
  let newVal = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
  slider.value = newVal;
  audio.volume = newVal;
}

function skipSeconds(delta) {
  vocalAudio.currentTime += delta;
  accompAudio.currentTime += delta;
}

// === 5. Bookmark System ===
function getBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarks") || "{}");
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

function updateBookmarkDropdown() {
  const dropdown = document.getElementById("bookmarkDropdown");
  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  const bookmarks = getBookmarks();

  const sortedFolders = Object.keys(bookmarks)
    .filter(f => f.startsWith("Favorites"))
    .sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));

  sortedFolders.forEach(folder => {
    const optGroup = document.createElement("optgroup");
    optGroup.label = folder;
    bookmarks[folder].forEach(song => {
      const opt = document.createElement("option");
      opt.value = song;
      opt.textContent = song;
      optGroup.appendChild(opt);
    });
    dropdown.appendChild(optGroup);
  });

  dropdown.addEventListener("change", e => {
    if (e.target.value) loadSong(e.target.value);
  });

  updateStarStatus();
}

function updateStarStatus() {
  const btn = document.getElementById("bookmarkBtn");
  const bookmarks = getBookmarks();
  let found = false;
  for (const folder in bookmarks) {
    if (bookmarks[folder].includes(currentPrefix)) {
      found = true;
      break;
    }
  }
  btn.textContent = found ? "⭐" : "☆";
}

function handleBookmarkClick() {
  const bookmarks = getBookmarks();
  const isBookmarked = Object.values(bookmarks).some(songs => songs.includes(currentPrefix));

  if (!isBookmarked) {
    // Add bookmark: show folder choices
    const folders = ["Favorites 1", "Favorites 2", "Favorites 3", "Favorites 4", "Favorites 5"];
    const folder = prompt(`Add to which folder?\n${folders.join("\n")}`, folders[0]);
    if (folder && folders.includes(folder)) {
      if (!bookmarks[folder]) bookmarks[folder] = [];
      if (!bookmarks[folder].includes(currentPrefix)) {
        bookmarks[folder].push(currentPrefix);
        saveBookmarks(bookmarks);
        updateBookmarkDropdown();
        alert(`✅ "${currentPrefix}" added to ${folder}`);
      }
    }
  } else {
    // Remove bookmark: show folder+song list
    const options = [];
    for (const folder in bookmarks) {
      bookmarks[folder].forEach(song => {
        if (song === currentPrefix) {
          options.push(`${folder} -> ${song}`);
        }
      });
    }

    const chosen = prompt(
      `Remove from which folder?\n${options.join("\n")}`,
      options.length ? options[0] : ""
    );

    if (chosen) {
      const [folder] = chosen.split(" -> ");
      bookmarks[folder] = bookmarks[folder].filter(s => s !== currentPrefix);
      if (bookmarks[folder].length === 0) delete bookmarks[folder];
      saveBookmarks(bookmarks);
      updateBookmarkDropdown();
      alert(`❌ "${currentPrefix}" removed from ${folder}`);
    }
  }
}

// === 6. Setup Events ===
document.getElementById("bookmarkBtn").addEventListener("click", handleBookmarkClick);
document.getElementById("playBtn").addEventListener("click", () => {
  vocalAudio.play();
  accompAudio.play();
});
document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});
document.getElementById("songSelect").addEventListener("change", e => {
  loadSong(e.target.value);
});

// === 7. Initialize ===
async function init() {
  await getAccessToken();
  const res = await fetch("lyrics/song_names.txt");
  const text = await res.text();
  const lines = text.split("\n").map(x => x.trim()).filter(Boolean);
  const select = document.getElementById("songSelect");
  lines.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  loadSong(lines[0]);
  updateBookmarkDropdown();
}
init();
