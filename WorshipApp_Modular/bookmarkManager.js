// === Bookmark Manager ===

function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedFolders");
  return stored ? JSON.parse(stored) : {
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

function updateBookmarkButtonVisual(isBookmarked) {
  const btn = document.getElementById("bookmarkBtn");
  if (isBookmarked) {
    btn.textContent = "★";
    btn.style.color = "gold";
  } else {
    btn.textContent = "☆";
    btn.style.color = "";
  }
}

function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();

  // Check if song is already bookmarked in any folder
  let folderContainingSong = null;
  for (let folder in bookmarks) {
    if (bookmarks[folder].includes(selectedSong)) {
      folderContainingSong = folder;
      break;
    }
  }

  if (folderContainingSong) {
    // === UNBOOKMARK ===
    const folder = prompt(
      `📂 This song is bookmarked in:\n${Object.keys(bookmarks)
        .filter(f => bookmarks[f].includes(selectedSong))
        .join("\n")}\n\nEnter the folder name to remove it from:`
    );
    if (folder && bookmarks[folder]) {
      bookmarks[folder] = bookmarks[folder].filter(song => song !== selectedSong);
      saveBookmarks(bookmarks);
      updateBookmarkButtonVisual(false);
      populateBookmarkDropdown();
    }
  } else {
    // === BOOKMARK ===
    const folder = prompt("⭐ Select a folder to bookmark:\nFavorites 1\nFavorites 2\nFavorites 3\nFavorites 4\nFavorites 5");
    if (folder && bookmarks[folder] && !bookmarks[folder].includes(selectedSong)) {
      bookmarks[folder].push(selectedSong);
      saveBookmarks(bookmarks);
      updateBookmarkButtonVisual(true);
      populateBookmarkDropdown();
    }
  }
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

  // Set correct star when a song is selected
  const songSelect = document.getElementById("songSelect");
  const selectedSong = songSelect.value;
  let found = false;
  for (let folder in bookmarks) {
    if (bookmarks[folder].includes(selectedSong)) {
      found = true;
      break;
    }
  }
  updateBookmarkButtonVisual(found);
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
