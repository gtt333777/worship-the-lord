// ===============================================
// 🌿 WorshipApp_Modular/bookmarksManager.js (v6)
// Simple + reliable + segment-aware bookmarks
// ===============================================

// === Helpers: Load & Save ===
function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedSongs");
  return stored ? JSON.parse(stored) : {};
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
}

// === Clear previous song data before loading ===
function clearPreviousSongData() {
  if (typeof stopAllPlayback === "function") stopAllPlayback();
  if (typeof pauseBothTracks === "function") pauseBothTracks();

  window.currentSegments = [];
  window.loadedSegments = [];

  const loopContainer = document.getElementById("loopButtonsContainer");
  if (loopContainer) loopContainer.innerHTML = "";

  const lyrics = document.getElementById("lyricsArea");
  if (lyrics) lyrics.value = "";

  console.log("🧹 Old song data cleared before loading new song.");
}

// === Toggle Bookmark ===
function toggleBookmark() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();
  const button = document.getElementById("bookmarkBtn");

  if (bookmarks[selectedSong]) {
    delete bookmarks[selectedSong];
    button.textContent = "☆";
    console.log(`❌ Removed bookmark: ${selectedSong}`);
  } else {
    bookmarks[selectedSong] = true;
    button.textContent = "★";
    console.log(`⭐ Added bookmark: ${selectedSong}`);
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// === Populate Bookmark Dropdown ===
function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();
  const dropdown = document.getElementById("bookmarkDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dropdown.appendChild(opt);
  });
}

// === Handle Bookmark Dropdown Change ===
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  console.log(`🎵 Bookmark selected: ${name}`);
  clearPreviousSongData();

  // Match main dropdown selection
  const songSelect = document.getElementById("songSelect");
  Array.from(songSelect.options).forEach(opt => {
    opt.selected = (opt.value === name);
  });

  // Load new song
  if (typeof loadLyricsForSelectedSong === "function") {
    loadLyricsForSelectedSong(songSelect);
  }

  // Wait until segments and buttons are ready, then play first segment
  let attempts = 0;
  const tryStart = () => {
    const segs = window.currentSegments || window.loadedSegments;
    const hasSegments = Array.isArray(segs) && segs.length > 0;
    const hasButtons = document.querySelectorAll(".loopButton").length > 0;
    const playable = typeof window.playSegment === "function";

    if (hasSegments && hasButtons && playable) {
      const first = segs[0];
      console.log("✅ Auto-playing Segment 1:", first);
      playSegment(first.start, first.end, 0);
    } else if (attempts++ < 20) {
      setTimeout(tryStart, 400);
    } else {
      console.warn("⚠️ Could not auto-start; please tap a segment manually.");
    }
  };
  setTimeout(tryStart, 1000);
}

// === Sync bookmark star when normal dropdown changes ===
function syncBookmarkStar() {
  const songSelect = document.getElementById("songSelect");
  const button = document.getElementById("bookmarkBtn");
  if (!songSelect || !button) return;

  const bookmarks = loadBookmarks();
  const currentSong = songSelect.value;
  button.textContent = bookmarks[currentSong] ? "★" : "☆";
}

// === Initialize Events ===
window.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  const bmButton = document.getElementById("bookmarkBtn");
  const bmDropdown = document.getElementById("bookmarkDropdown");

  if (bmButton) bmButton.addEventListener("click", toggleBookmark);
  if (bmDropdown) bmDropdown.addEventListener("change", handleBookmarkDropdownChange);
  if (songSelect) songSelect.addEventListener("change", () => {
    clearPreviousSongData();
    syncBookmarkStar();
  });

  populateBookmarkDropdown();
  syncBookmarkStar();

  console.log("📚 bookmarksManager.js v6 loaded successfully.");
});
