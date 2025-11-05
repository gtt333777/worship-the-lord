// ==============================================
// 🌟 WorshipApp_Modular/bookmarksManager.js (v5 final stable)
// Fully synchronized — segments always appear before play
// ==============================================

// === 🌈 Devotional Alert Banner ===
window.showAlertBanner = function (message, type = "info", duration = 2500) {
  const banner = document.getElementById("alertBanner");
  if (!banner) return;
  const themes = {
    success: { bg: "linear-gradient(to right,#2e7d32,#1b5e20)", emoji: "🌿" },
    warning: { bg: "linear-gradient(to right,#ef6c00,#f57c00)", emoji: "⚠️" },
    error:   { bg: "linear-gradient(to right,#b71c1c,#880e4f)", emoji: "❌" },
    info:    { bg: "linear-gradient(to right,#1976d2,#0d47a1)", emoji: "🙏" },
    wait:    { bg: "linear-gradient(to right,#607d8b,#455a64)", emoji: "⏳" },
  };
  const theme = themes[type] || themes.info;
  banner.textContent = `${theme.emoji} ${message}`;
  banner.style.background = theme.bg;
  banner.classList.add("show");
  setTimeout(() => banner.classList.remove("show"), duration);
};

// === Local Storage Helpers ===
function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem("bookmarkedSongs") || "{}"); }
  catch { return {}; }
}
function saveBookmarks(obj) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(obj));
}

// === Clear Everything Before Loading a New Song ===
function clearOldSongData() {
  if (typeof stopAllPlayback === "function") stopAllPlayback();
  if (typeof pauseBothTracks === "function") pauseBothTracks();

  window.currentSegments = [];
  window.loadedSegments = [];

  const loopContainer = document.getElementById("loopButtonsContainer");
  if (loopContainer) loopContainer.innerHTML = "";

  const lyrics = document.getElementById("lyricsArea");
  if (lyrics) lyrics.value = "";

  console.log("🧹 Cleared previous song data before loading new one.");
}

// === Toggle Bookmark ===
function toggleBookmark() {
  const songSelect = document.getElementById("songSelect");
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  if (!songSelect || !bookmarkBtn) return;
  const song = songSelect.value;
  if (!song) return;

  const bookmarks = loadBookmarks();
  if (bookmarks[song]) {
    delete bookmarks[song];
    bookmarkBtn.textContent = "☆";
    showAlertBanner(`“${song}” removed from Bookmarks.`, "warning");
  } else {
    bookmarks[song] = true;
    bookmarkBtn.textContent = "★";
    showAlertBanner(`“${song}” added to Bookmarks!`, "success");
  }
  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// === Populate Bookmarks Dropdown ===
function populateBookmarkDropdown() {
  const dd = document.getElementById("bookmarkDropdown");
  if (!dd) return;
  const bookmarks = loadBookmarks();
  dd.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dd.appendChild(opt);
  });
}

// === Sync Star Icon with Current Song ===
function syncBookmarkStar() {
  const songSelect = document.getElementById("songSelect");
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const bmDropdown = document.getElementById("bookmarkDropdown");
  if (!songSelect || !bookmarkBtn) return;

  const bookmarks = loadBookmarks();
  bookmarkBtn.textContent = bookmarks[songSelect.value] ? "★" : "☆";

  if (bmDropdown) bmDropdown.value = "";
}

// === Wait for Segments + playSegment to be ready ===
function waitForSegmentsAndPlay(name) {
  let attempts = 0;
  showAlertBanner(`⏳ Preparing “${name}”…`, "wait", 4000);

  const tryPlay = () => {
    const segs = window.currentSegments || window.loadedSegments;
    const ready = Array.isArray(segs) && segs.length > 0;
    const playable = typeof window.playSegment === "function";

    if (ready && playable) {
      const first = segs[0];
      playSegment(first.start, first.end, 0);
      showAlertBanner(`🎶 “${name}” started at Segment 1.`, "success");
      console.log("✅ Auto-started from Segment 1.");
    } else if (attempts++ < 25) {
      setTimeout(tryPlay, 400);
    } else {
      console.warn("⚠️ Could not auto-start — user must press Play.");
      showAlertBanner(`⚠️ “${name}” loaded — tap Play.`, "warning");
    }
  };
  setTimeout(tryPlay, 1500);
}

// === Handle Bookmark Dropdown Selection ===
function handleBookmarkDropdownChange() {
  const dd = document.getElementById("bookmarkDropdown");
  const name = dd ? dd.value : "";
  if (!name) return;

  const songSelect = document.getElementById("songSelect");
  if (!songSelect) return;

  // Match same song in main dropdown
  Array.from(songSelect.options).forEach(opt => opt.selected = (opt.value === name));

  // Cleanup first
  clearOldSongData();

  // Trigger loading
  if (typeof loadLyricsForSelectedSong === "function") {
    showAlertBanner(`🎵 “${name}” loading from Bookmarks…`, "info");
    loadLyricsForSelectedSong(songSelect);
    waitForSegmentsAndPlay(name);
  } else {
    console.error("❌ loadLyricsForSelectedSong() missing.");
  }
}

// === Event Listeners ===
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("bookmarkBtn");
  const songSelect = document.getElementById("songSelect");
  const bmDropdown = document.getElementById("bookmarkDropdown");

  if (btn) btn.addEventListener("click", toggleBookmark);
  if (songSelect) songSelect.addEventListener("change", () => {
    clearOldSongData();
    syncBookmarkStar();
  });
  if (bmDropdown) bmDropdown.addEventListener("change", handleBookmarkDropdownChange);

  populateBookmarkDropdown();
  syncBookmarkStar();
});
