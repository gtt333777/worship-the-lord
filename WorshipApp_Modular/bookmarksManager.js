// ==============================================
// 🌟 WorshipApp_Modular/bookmarksManager.js
// Handles bookmarking songs (add/remove),
// persistent storage, and devotional banners
// ==============================================

// === 🌈 Global Devotional Alert Banner ===
// Reusable across all modules (cache, share, etc.)
window.showAlertBanner = function(message, type = "info", duration = 2800) {
  const banner = document.getElementById("alertBanner");
  if (!banner) return;

  const themes = {
    success: { bg: "linear-gradient(to right, #2e7d32, #1b5e20)", emoji: "🌿" },
    warning: { bg: "linear-gradient(to right, #ef6c00, #f57c00)", emoji: "⚠️" },
    error:   { bg: "linear-gradient(to right, #b71c1c, #880e4f)", emoji: "❌" },
    info:    { bg: "linear-gradient(to right, #1976d2, #0d47a1)", emoji: "🙏" }
  };

  const theme = themes[type] || themes.info;

  // Apply background and message
  banner.textContent = `${theme.emoji} ${message}`;
  banner.style.background = theme.bg;
  banner.style.display = "block";
  banner.style.opacity = "1";

  // Trigger smooth slide + fade animation
  banner.classList.add("show");

  // Remove after duration
  setTimeout(() => {
    banner.classList.remove("show");
    // hide after animation ends
    setTimeout(() => {
      banner.style.display = "none";
    }, 500);
  }, duration);
};

// === Bookmark Handling ===

// Load bookmarks from localStorage
function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedSongs");
  return stored ? JSON.parse(stored) : {};
}

// Save bookmarks back to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
}

// Toggle bookmark for selected song
function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();

  if (bookmarks[selectedSong]) {
    // Remove bookmark
    delete bookmarks[selectedSong];
    document.getElementById("bookmarkBtn").textContent = "☆";
    showAlertBanner(`“${selectedSong}” removed from Bookmarks.`, "warning");
  } else {
    // Add bookmark
    bookmarks[selectedSong] = true;
    document.getElementById("bookmarkBtn").textContent = "★";
    showAlertBanner(`“${selectedSong}” added to Bookmarks!`, "success");
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// Populate the dropdown with bookmarked songs
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

// Handle bookmark dropdown change (play selected song)
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  const songSelect = document.getElementById("songSelect");

  // Select the corresponding song in the main dropdown
  Array.from(songSelect.options).forEach(opt => {
    if (opt.value === name) opt.selected = true;
  });

  // Now hand control back to the main flow
  if (typeof loadLyricsForSelectedSong === "function") {
    loadLyricsForSelectedSong(songSelect);
    showAlertBanner(`🎵 Playing “${name}” from Bookmarks.`, "info");
  } else {
    console.warn("⚠️ loadLyricsForSelectedSong not defined yet.");
    showAlertBanner("⚠️ Song loader not ready yet.", "error");
  }
}

// === Attach Events ===
window.addEventListener("DOMContentLoaded", () => {
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const dropdown = document.getElementById("bookmarkDropdown");

  if (bookmarkBtn) bookmarkBtn.addEventListener("click", toggleBookmark);
  if (dropdown) dropdown.addEventListener("change", handleBookmarkDropdownChange);

  populateBookmarkDropdown();
});
