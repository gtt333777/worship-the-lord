// ==============================================
// 🌟 WorshipApp_Modular/bookmarksManager.js
// Handles bookmarking songs (add/remove),
// persistent storage, devotional banners,
// and auto-segment playback for bookmarks
// ==============================================

// === 🌈 Devotional Alert Banner ===
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

// === Bookmark Storage ===
function loadBookmarks() {
  try {
    const stored = localStorage.getItem("bookmarkedSongs");
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.warn("⚠️ Error reading bookmarks:", e);
    return {};
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
  } catch (e) {
    console.warn("⚠️ Error saving bookmarks:", e);
  }
}

// === Toggle Bookmark (add/remove) ===
function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  if (!dropdown) return;

  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();
  const btn = document.getElementById("bookmarkBtn");

  if (bookmarks[selectedSong]) {
    delete bookmarks[selectedSong];
    btn.textContent = "☆";
    showAlertBanner(`“${selectedSong}” removed from Bookmarks.`, "warning");
  } else {
    bookmarks[selectedSong] = true;
    btn.textContent = "★";
    showAlertBanner(`“${selectedSong}” added to Bookmarks!`, "success");
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// === Populate Bookmarked Songs Dropdown ===
function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dropdown = document.getElementById("bookmarkDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dropdown.appendChild(opt);
  });
}

// === Handle Bookmark Selection ===
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  const songSelect = document.getElementById("songSelect");
  if (!songSelect) return;

  // highlight same song in main dropdown
  Array.from(songSelect.options).forEach((opt) => {
    opt.selected = (opt.value === name);
  });

  // stop all current playback first
  if (typeof pauseBothTracks === "function") pauseBothTracks();
  if (typeof stopAllPlayback === "function") stopAllPlayback();

  // now load lyrics for the selected song
  if (typeof loadLyricsForSelectedSong === "function") {
    loadLyricsForSelectedSong(songSelect);
    showAlertBanner(`🎵 “${name}” loading from Bookmarks...`, "info");

    // Wait until playSegment becomes available
    let retries = 0;
    const tryPlaySegment = () => {
      if (typeof playSegment === "function") {
        playSegment(1);
        showAlertBanner(`🎶 “${name}” started at Segment 1.`, "success");
      } else if (retries < 10) {
        retries++;
        setTimeout(tryPlaySegment, 300); // retry every 300ms (3s total)
      } else {
        console.warn("⚠️ playSegment() not available after 3 s retry.");
        showAlertBanner("⚠️ Could not auto-start Segment 1.", "warning");
      }
    };

    setTimeout(tryPlaySegment, 800); // initial small grace delay
  } else {
    console.warn("⚠️ loadLyricsForSelectedSong() not defined yet.");
    showAlertBanner("⚠️ Song loader not ready yet.", "error");
  }
}

// === Attach Listeners ===
window.addEventListener("DOMContentLoaded", () => {
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const dropdown = document.getElementById("bookmarkDropdown");

  if (bookmarkBtn) bookmarkBtn.addEventListener("click", toggleBookmark);
  if (dropdown) dropdown.addEventListener("change", handleBookmarkDropdownChange);

  populateBookmarkDropdown();
});
