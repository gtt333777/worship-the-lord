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
  document.getElementById("bookmarkDropdown").addEventListener("change", handleBookmarkDropdownChange);
  populateBookmarkDropdown();
});
