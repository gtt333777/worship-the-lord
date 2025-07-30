// === Bookmark Manager ===

// Globals to track pending action
let pendingAction = null;
let pendingSong = null;

function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedFolders");
  return stored
    ? JSON.parse(stored)
    : {
        "Favorites 1": [],
        "Favorites 2": [],
        "Favorites 3": [],
        "Favorites 4": [],
        "Favorites 5": []
      };
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedFolders", JSON.stringify(bookmarks));
}

function isSongBookmarked(songName) {
  const bookmarks = loadBookmarks();
  return Object.values(bookmarks).some(folderSongs => folderSongs.includes(songName));
}

function updateBookmarkButtonVisual(forceStatus = null) {
  const btn = document.getElementById("bookmarkBtn");
  const songSelect = document.getElementById("songSelect");
  const selectedSong = songSelect.value;
  const isBookmarked = forceStatus !== null ? forceStatus : isSongBookmarked(selectedSong);

  btn.textContent = isBookmarked ? "★" : "☆";
  btn.style.color = isBookmarked ? "gold" : "";
}

function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();
  let folderWithSong = null;

  for (let folder in bookmarks) {
    if (bookmarks[folder].includes(selectedSong)) {
      folderWithSong = folder;
      break;
    }
  }

  pendingSong = selectedSong;

  if (folderWithSong) {
    pendingAction = "unbookmark";
  } else {
    pendingAction = "bookmark";
  }

  showFolderModal();
}

function showFolderModal() {
  const label = document.querySelector("#folderModal label");
  if (pendingAction === "bookmark") {
    label.textContent = "📁 Select folder to ADD this song:";
  } else {
    label.textContent = "📁 Select folder to REMOVE this song:";
  }

  document.getElementById("folderModal").style.display = "block";
  document.getElementById("folderSelect").value = "";
}

function cancelFolder() {
  document.getElementById("folderModal").style.display = "none";
  pendingAction = null;
  pendingSong = null;
}

function confirmFolder() {
  const folder = document.getElementById("folderSelect").value;
  if (!folder) return;

  const bookmarks = loadBookmarks();

  if (pendingAction === "bookmark") {
    if (!bookmarks[folder].includes(pendingSong)) {
      bookmarks[folder].push(pendingSong);
    }
  } else if (pendingAction === "unbookmark") {
    bookmarks[folder] = bookmarks[folder].filter(song => song !== pendingSong);
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
  updateBookmarkButtonVisual(); // Refresh visual after change
  cancelFolder();
}

function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dropdown = document.getElementById("bookmarkDropdown");
  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;

  Object.keys(bookmarks).forEach(folder => {
    bookmarks[folder].forEach(song => {
      const opt = document.createElement("option");
      opt.value = song;
      opt.textContent = `${folder} → ${song}`;
      dropdown.appendChild(opt);
    });
  });

  // Update star visual for selected song
  const songSelect = document.getElementById("songSelect");
  const selectedSong = songSelect.value;
  updateBookmarkButtonVisual(isSongBookmarked(selectedSong));
}

function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  // Select the song in the main dropdown
  const songSelect = document.getElementById("songSelect");
  Array.from(songSelect.options).forEach(opt => {
    if (opt.value === name) opt.selected = true;
  });

  loadLyricsForSelectedSong(songSelect);
}

// === Attach Events ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("bookmarkBtn").addEventListener("click", toggleBookmark);
  document.getElementById("bookmarkDropdown").addEventListener("change", handleBookmarkDropdownChange);
  populateBookmarkDropdown();
});
