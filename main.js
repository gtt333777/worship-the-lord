const vocalAudio = new Audio();
const accompAudio = new Audio();
let bookmarks = {};
let currentFavoritesFolder = "Favorites 1";

function loadSongs() {
  fetch("lyrics/songs_names.txt")
    .then((response) => response.text())
    .then((text) => {
      const songList = document.getElementById("songList");
      const lines = text.trim().split("\n");
      lines.forEach((line) => {
        const option = document.createElement("option");
        option.value = option.textContent = line.trim();
        songList.appendChild(option);
      });
      loadBookmarksFromStorage();
      updateBookmarkDropdown();
      updateStarIcon();
    });
}

function loadLyrics(songName) {
  fetch(`lyrics/${songName}.txt`)
    .then((response) => response.text())
    .then((text) => {
      document.getElementById("lyricsDisplay").textContent = text;
    });
}

function getFileUrl(fileName) {
  const prefix = fileName.trim();
  const folder = "https://content.dropboxapi.com/2/files/download";
  const path = `/WorshipSongs/${prefix}`;
  return {
    vocal: `/proxy?path=${encodeURIComponent(path + "_vocal.flac")}`,
    acc: `/proxy?path=${encodeURIComponent(path + "_acc.flac")}`,
  };
}

function playAudio() {
  const songName = document.getElementById("songList").value;
  const urls = getFileUrl(songName);
  vocalAudio.src = urls.vocal;
  accompAudio.src = urls.acc;

  vocalAudio.volume = parseFloat(document.getElementById("vocalVolume").value);
  accompAudio.volume = parseFloat(document.getElementById("accompVolume").value);

  vocalAudio.play();
  accompAudio.play();
}

function pauseAudio() {
  vocalAudio.pause();
  accompAudio.pause();
}

function adjustVolume(audio, delta) {
  let newVolume = Math.min(1, Math.max(0, audio.volume + delta));
  audio.volume = newVolume;
}

function adjustBookmarkStar() {
  const songName = document.getElementById("songList").value;
  const isBookmarked = isSongBookmarked(songName);
  const star = document.getElementById("bookmarkStar");
  star.textContent = isBookmarked ? "☆" : "★";
}

function toggleBookmark() {
  const songName = document.getElementById("songList").value;
  if (isSongBookmarked(songName)) {
    removeBookmark(songName);
  } else {
    const selected = prompt("Add to Favorites 1 to 5. Enter number:");
    if (!selected || !["1", "2", "3", "4", "5"].includes(selected)) return;

    const folder = "Favorites " + selected;
    if (!bookmarks[folder]) bookmarks[folder] = [];
    if (!bookmarks[folder].includes(songName)) {
      bookmarks[folder].push(songName);
    }
    saveBookmarksToStorage();
  }
  updateBookmarkDropdown();
  updateStarIcon();
}

function isSongBookmarked(songName) {
  return Object.values(bookmarks).some((list) => list.includes(songName));
}

function removeBookmark(songName) {
  for (let folder in bookmarks) {
    bookmarks[folder] = bookmarks[folder].filter((s) => s !== songName);
  }
  saveBookmarksToStorage();
}

function updateBookmarkDropdown() {
  const dropdown = document.getElementById("bookmarkDropdown");
  dropdown.innerHTML = "";
  const opt = document.createElement("option");
  opt.textContent = "📕 Bookmarked Songs";
  opt.disabled = true;
  dropdown.appendChild(opt);

  Object.keys(bookmarks)
    .filter((f) => /^Favorites [1-5]$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.split(" ")[1]);
      const numB = parseInt(b.split(" ")[1]);
      return numA - numB;
    })
    .forEach((folder) => {
      const folderOpt = document.createElement("option");
      folderOpt.disabled = true;
      folderOpt.textContent = folder;
      dropdown.appendChild(folderOpt);
      bookmarks[folder].forEach((song) => {
        const opt = document.createElement("option");
        opt.value = song;
        opt.textContent = song;
        dropdown.appendChild(opt);
      });
    });
}

function saveBookmarksToStorage() {
  localStorage.setItem("worshipBookmarks", JSON.stringify(bookmarks));
}

function loadBookmarksFromStorage() {
  const data = localStorage.getItem("worshipBookmarks");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === "object" && parsed !== null) {
        bookmarks = parsed;
      }
    } catch (e) {
      bookmarks = {};
    }
  }
}

function updateStarIcon() {
  const songName = document.getElementById("songList").value;
  const isBookmarked = isSongBookmarked(songName);
  document.getElementById("bookmarkStar").textContent = isBookmarked ? "★" : "☆";
}

// Event Listeners
document.getElementById("songList").addEventListener("change", function () {
  loadLyrics(this.value);
  updateStarIcon();
});

document.getElementById("bookmarkStar").addEventListener("click", toggleBookmark);

document.getElementById("bookmarkDropdown").addEventListener("change", function () {
  if (this.value) {
    document.getElementById("songList").value = this.value;
    loadLyrics(this.value);
    updateStarIcon();
  }
});

document.getElementById("playBtn").addEventListener("click", playAudio);
document.getElementById("pauseBtn").addEventListener("click", pauseAudio);

document.getElementById("vocalPlus").addEventListener("click", () => {
  adjustVolume(vocalAudio, 0.1);
});

document.getElementById("vocalMinus").addEventListener("click", () => {
  adjustVolume(vocalAudio, -0.1);
});

document.getElementById("accompPlus").addEventListener("click", () => {
  adjustVolume(accompAudio, 0.1);
});

document.getElementById("accompMinus").addEventListener("click", () => {
  adjustVolume(accompAudio, -0.1);
});

// Load everything
loadSongs();
