// ==============================================
// 🌟 WorshipApp_Modular/bookmarksManager.js (v2)
// Handles bookmarking songs + starts at Segment 1
// ==============================================

// === 🌈 Devotional Alert Banner ===
window.showAlertBanner = function (message, type = "info", duration = 2800) {
  const banner = document.getElementById("alertBanner");
  if (!banner) return;

  const themes = {
    success: { bg: "linear-gradient(to right,#2e7d32,#1b5e20)", emoji: "🌿" },
    warning: { bg: "linear-gradient(to right,#ef6c00,#f57c00)", emoji: "⚠️" },
    error: { bg: "linear-gradient(to right,#b71c1c,#880e4f)", emoji: "❌" },
    info: { bg: "linear-gradient(to right,#1976d2,#0d47a1)", emoji: "🙏" },
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
    return JSON.parse(localStorage.getItem("bookmarkedSongs") || "{}");
  } catch {
    return {};
  }
}
function saveBookmarks(obj) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(obj));
}

// === Toggle Bookmark (add/remove) ===
function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  if (!dropdown) return;
  const name = dropdown.value;
  if (!name) return;

  const bookmarks = loadBookmarks();
  const btn = document.getElementById("bookmarkBtn");

  if (bookmarks[name]) {
    delete bookmarks[name];
    btn.textContent = "☆";
    showAlertBanner(`“${name}” removed from Bookmarks.`, "warning");
  } else {
    bookmarks[name] = true;
    btn.textContent = "★";
    showAlertBanner(`“${name}” added to Bookmarks!`, "success");
  }
  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// === Populate Bookmarked Songs Dropdown ===
function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dd = document.getElementById("bookmarkDropdown");
  if (!dd) return;
  dd.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach((n) => {
    const o = document.createElement("option");
    o.value = n; o.textContent = n; dd.appendChild(o);
  });
}

// === Handle Bookmark Selection (fixed) ===
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  const songSelect = document.getElementById("songSelect");
  if (!songSelect) return;

  // Highlight same song in main selector
  Array.from(songSelect.options).forEach(opt => opt.selected = (opt.value === name));

  // Stop playback before switching
  if (typeof stopAllPlayback === "function") stopAllPlayback();
  if (typeof pauseBothTracks === "function") pauseBothTracks();

  // Load the song
  if (typeof loadLyricsForSelectedSong === "function") {
    loadLyricsForSelectedSong(songSelect);
    showAlertBanner(`🎵 “${name}” loading from Bookmarks...`, "info");

    // Wait for segments to load and play the first one
    let attempts = 0;
    const tryStart = () => {
      const segs = window.currentSegments || window.loadedSegments;
      if (Array.isArray(segs) && segs.length && typeof playSegment === "function") {
        const first = segs[0];
        playSegment(first.start, first.end, 0);
        showAlertBanner(`🎶 “${name}” started at Segment 1.`, "success");
      } else if (attempts++ < 15) {
        setTimeout(tryStart, 300); // retry up to 4.5 s total
      } else {
        console.warn("⚠️ Could not start first segment automatically.");
      }
    };
    setTimeout(tryStart, 1000);
  } else {
    showAlertBanner("⚠️ Song loader not ready.", "error");
  }
}

// === Attach Listeners ===
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("bookmarkBtn");
  const dd = document.getElementById("bookmarkDropdown");
  if (btn) btn.addEventListener("click", toggleBookmark);
  if (dd) dd.addEventListener("change", handleBookmarkDropdownChange);
  populateBookmarkDropdown();
});
