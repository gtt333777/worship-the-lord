// === Bookmark Handling ===

function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedSongs");
  return stored ? JSON.parse(stored) : {};
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
}

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

// === Attach Bookmark Events ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("bookmarkBtn").addEventListener("click", toggleBookmark);
  document.getElementById("bookmarkDropdown").addEventListener("change", handleBookmarkDropdownChange);
  populateBookmarkDropdown();
});
