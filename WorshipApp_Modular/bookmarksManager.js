// ==============================================
// 🌟 WorshipApp_Modular/bookmarksManager.js
// Handles bookmarking songs (add/remove),
// persistent storage, devotional banners,
// and now auto-segment playback for bookmarks
// ==============================================

// === 🌈 Global Devotional Alert Banner ===
window.showAlertBanner = function (message, type = "info", duration = 2800) {
  const banner = document.getElementById("alertBanner");
  if (!banner) return;

  const themes = {
    success: {
      bg: "linear-gradient(to right, #2e7d32, #1b5e20)", // green blessing
      emoji: "🌿",
    },
    warning: {
      bg: "linear-gradient(to right, #ef6c00, #f57c00)", // amber caution
      emoji: "⚠️",
    },
    error: {
      bg: "linear-gradient(to right, #b71c1c, #880e4f)", // crimson sorrow
      emoji: "❌",
    },
    info: {
      bg: "linear-gradient(to right, #1976d2, #0d47a1)", // divine blue
      emoji: "🙏",
    },
  };

  const theme = themes[type] || themes.info;

  banner.textContent = `${theme.emoji} ${message}`;
  banner.style.background = theme.bg;
  banner.classList.add("show");

  setTimeout(() => banner.classList.remove("show"), duration);
};

// === Bookmark Handling ===
function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedSongs");
  return stored ? JSON.parse(stored) : {};
}

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
    delete bookmarks[selectedSong];
    document.getElementById("bookmarkBtn").textContent = "☆";
    showAlertBanner(`“${selectedSong}” removed from Bookmarks.`, "warning");
  } else {
    bookmarks[selectedSong] = true;
    document.getElementById("bookmarkBtn").textContent = "★";
    showAlertBanner(`“${selectedSong}” added to Bookmarks!`, "success");
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// Populate dropdown with bookmarked songs
function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dropdown = document.getElementById("bookmarkDropdown");

  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dropdown.appendChild(opt);
  });
}

// === Handle when user selects a bookmarked song ===
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  const songSelect = document.getElementById("songSelect");

  // Highlight same song in main dropdown
  Array.from(songSelect.options).forEach((opt) => {
    if (opt.value === name) opt.selected = true;
  });

  // 🛑 Stop any ongoing playback before switching
  if (typeof pauseBothTracks === "function") pauseBothTracks();
  if (typeof stopAllPlayback === "function") stopAllPlayback();

  // Load lyrics normally
  if (typeof loadLyricsForSelectedSong === "function") {
    loadLyricsForSelectedSong(songSelect);
    showAlertBanner(`🎵 “${name}” loading from Bookmarks...`, "info");

    // ⏳ Wait until playback engine ready
    let retries = 0;
    const tryPlaySegment = () => {
      retries++;
      if (typeof playSegment === "function") {
        playSegment(1);
        showAlertBanner(`🎶 “${name}” started at Segment 1.`, "success");
      } else if (retries < 10) {
        // Try again every 300 ms (up to ~3 s total)
        setTimeout(tryPlaySegment, 300);
      } else {
        console.warn("⚠️ playSegment() not available after 3 s retry.");
        showAlertBanner(`⚠️ Could not auto-start Segment 1.`, "warning");
      }
    };

    // Begin polling after small grace period
    setTimeout(tryPlaySegment, 800);
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
