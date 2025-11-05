// 🎯 bookmarkManager.js — Clean, synced version (no alerts/banners)

console.log("⭐ bookmarkManager.js: Loaded");

// --- Local storage helpers ---
function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedSongs");
  return stored ? JSON.parse(stored) : {};
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
}

// --- Toggle Bookmark ---
function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();

  if (bookmarks[selectedSong]) {
    delete bookmarks[selectedSong];
    document.getElementById("bookmarkBtn").textContent = "☆";
  } else {
    bookmarks[selectedSong] = true;
    document.getElementById("bookmarkBtn").textContent = "★";
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// --- Populate the Bookmarked Songs dropdown ---
function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dropdown = document.getElementById("bookmarkDropdown");
  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;

  Object.keys(bookmarks).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dropdown.appendChild(opt);
  });
}

// --- Clear old content (lyrics, segment buttons, etc.) ---
function clearOldSongData() {
  const lyricsArea = document.getElementById("lyricsArea");
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");

  if (lyricsArea) lyricsArea.value = "";
  if (loopButtonsDiv) loopButtonsDiv.innerHTML = "";
}

// --- Handle selecting from bookmark dropdown ---
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  // Select same song in normal dropdown
  const songSelect = document.getElementById("songSelect");
  Array.from(songSelect.options).forEach(opt => {
    if (opt.value === name) opt.selected = true;
  });

  clearOldSongData(); // clear before load
  document.getElementById("bookmarkBtn").textContent = "★";
  loadLyricsForSelectedSong(songSelect);
}

// --- Handle selecting from normal dropdown ---
function handleNormalDropdownChange() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  const bookmarks = loadBookmarks();

  clearOldSongData(); // clear before load

  // Empty star when from normal dropdown (even if bookmarked)
  document.getElementById("bookmarkBtn").textContent = "☆";

  // Also deselect any bookmark dropdown entry
  const bmDropdown = document.getElementById("bookmarkDropdown");
  if (bmDropdown) bmDropdown.value = "";

  if (selectedSong) {
    loadLyricsForSelectedSong(dropdown);
  }
}

// --- Initialize everything ---
window.addEventListener("DOMContentLoaded", () => {
  const bmBtn = document.getElementById("bookmarkBtn");
  const bmDropdown = document.getElementById("bookmarkDropdown");
  const songDropdown = document.getElementById("songSelect");

  if (bmBtn) bmBtn.addEventListener("click", toggleBookmark);
  if (bmDropdown) bmDropdown.addEventListener("change", handleBookmarkDropdownChange);
  if (songDropdown) songDropdown.addEventListener("change", handleNormalDropdownChange);

  populateBookmarkDropdown();

  // Make sure no song selected on first load
  if (songDropdown) songDropdown.value = "";
});
