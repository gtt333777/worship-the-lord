// ==============================================
// 🌟 WorshipApp_Modular/bookmarkManager.js (v3)
// Full: proper cleanup + accurate star sync + safe playback
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

// === Toggle Bookmark ===
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

// === Populate Dropdown ===
function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dd = document.getElementById("bookmarkDropdown");
  if (!dd) return;
  dd.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach((n) => {
    const o = document.createElement("option");
    o.value = n;
    o.textContent = n;
    dd.appendChild(o);
  });
}

// === Update Star when Normal Dropdown Changes ===
function syncBookmarkStar() {
  const songSelect = document.getElementById("songSelect");
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const bookmarks = loadBookmarks();
  const currentSong = songSelect ? songSelect.value : "";

  if (!bookmarkBtn) return;

  if (currentSong && bookmarks[currentSong]) {
    bookmarkBtn.textContent = "★";
  } else {
    bookmarkBtn.textContent = "☆";
  }

  // Clear bookmark dropdown selection
  const bmDropdown = document.getElementById("bookmarkDropdown");
  if (bmDropdown) bmDropdown.value = "";
}

// === Safe Cleanup before Loading a New Song ===
function clearOldSongData() {
  if (typeof stopAllPlayback === "function") stopAllPlayback();
  if (typeof pauseBothTracks === "function") pauseBothTracks();

  // Clear any displayed lyrics
  const lyrics = document.getElementById("lyricsArea");
  if (lyrics) lyrics.value = "";

  // Reset currentSegments & buttons
  window.currentSegments = [];
  window.loadedSegments = [];
  const loopContainer = document.getElementById("loopButtonsContainer");
  if (loopContainer) loopContainer.innerHTML = "";

  console.log("🧹 Cleared old song data before loading new one.");
}

// === Handle Bookmark Dropdown Change ===
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  const songSelect = document.getElementById("songSelect");
  if (!songSelect) return;

  // highlight same song in main dropdown
  Array.from(songSelect.options).forEach((opt) => (opt.selected = opt.value === name));

  // clear before loading new song
  clearOldSongData();

  // load new song
  if (typeof loadLyricsForSelectedSong === "function") {
    loadLyricsForSelectedSong(songSelect);
    showAlertBanner(`🎵 “${name}” loading from Bookmarks...`, "info");

    let tries = 0;
    const waitAndPlay = () => {
      const segs = window.currentSegments || window.loadedSegments;
      if (Array.isArray(segs) && segs.length && typeof playSegment === "function") {
        const first = segs[0];
        playSegment(first.start, first.end, 0);
        showAlertBanner(`🎶 “${name}” started at Segment 1.`, "success");
      } else if (tries++ < 15) {
        setTimeout(waitAndPlay, 300);
      }
    };
    setTimeout(waitAndPlay, 1000);
  }
}

// === Attach Event Listeners ===
window.addEventListener("DOMContentLoaded", () => {
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const dropdown = document.getElementById("bookmarkDropdown");
  const songSelect = document.getElementById("songSelect");

  if (bookmarkBtn) bookmarkBtn.addEventListener("click", toggleBookmark);
  if (dropdown) dropdown.addEventListener("change", handleBookmarkDropdownChange);
  if (songSelect) songSelect.addEventListener("change", () => {
    clearOldSongData();
    syncBookmarkStar();
  });

  populateBookmarkDropdown();
  syncBookmarkStar();
});
