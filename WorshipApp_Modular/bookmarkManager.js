// === bookmarkManager.js ===

let bookmarksByFolder = {};
let selectedFolder = null;

function loadBookmarksFromStorage() {
  const data = localStorage.getItem("worshipBookmarks");
  if (data) {
    bookmarksByFolder = JSON.parse(data);
  } else {
    bookmarksByFolder = {
      "Favorites 1": [],
      "Favorites 2": [],
      "Favorites 3": [],
      "Favorites 4": [],
      "Favorites 5": []
    };
  }
}

function saveBookmarksToStorage() {
  localStorage.setItem("worshipBookmarks", JSON.stringify(bookmarksByFolder));
}

function isSongBookmarked(songName) {
  return Object.values(bookmarksByFolder).some(folder =>
    folder.includes(songName)
  );
}

function showBookmarkFolders(callback) {
  const folder = prompt(
    "Choose a folder (1 to 5) to bookmark this song into:",
    "1"
  );
  if (!folder || !["1", "2", "3", "4", "5"].includes(folder.trim())) return;
  const folderName = `Favorites ${folder.trim()}`;
  callback(folderName);
}

function renderSongListWithBookmarks() {
  console.log("📁 renderSongListWithBookmarks() not yet implemented in UI");
  // You may later implement rendering of bookmark contents.
}

function setupBookmarkFlow() {
  const songSelect = document.getElementById("songSelect");
  const bookmarkThisBtn = document.getElementById("bookmarkThisBtn");

  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value;
    bookmarkThisBtn.style.display = selectedSong ? "inline-block" : "none";
    console.log("🎵 Selected:", selectedSong);
    if (isSongBookmarked(selectedSong)) {
      bookmarkThisBtn.textContent = "⭐ Bookmarked";
    } else {
      bookmarkThisBtn.textContent = "⭐ Bookmark This Song";
    }
  });

  bookmarkThisBtn.addEventListener("click", () => {
    const song = songSelect.value;
    if (!song) return;

    if (isSongBookmarked(song)) {
      alert("This song is already bookmarked.");
      return;
    }

    showBookmarkFolders(folderName => {
      bookmarksByFolder[folderName].push(song);
      saveBookmarksToStorage();
      bookmarkThisBtn.textContent = "⭐ Bookmarked";
      alert(`Bookmarked to ${folderName}`);
    });
  });
}

// === Initialize bookmark system ===
loadBookmarksFromStorage();
setupBookmarkFlow();
