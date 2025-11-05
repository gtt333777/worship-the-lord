// WorshipApp_Modular/songNamesLoader.js
console.log("🎵 songNamesLoader.js: Starting (Cloudflare R2 mode + Unicode safe)…");

const R2_BASE_URL = "https://pub-c84190e6ff024cb9876d50ae10614e90.r2.dev/";

// Helper – normalize all names (removes hidden Unicode/extra spaces)
function normalizeName(name) {
  return name.trim().normalize("NFC").replace(/\s+/g, " ");
}

async function loadSongNames() {
  const select = document.getElementById("songSelect");
  if (!select) {
    console.error("❌ songNamesLoader.js: #songSelect not found.");
    return;
  }

  try {
    console.log("📂 Fetching lyrics/songs_names.txt…");
    const res = await fetch("lyrics/songs_names.txt");
    if (!res.ok) throw new Error("songs_names.txt not found");

    const text = await res.text();
    const lines = text
      .split(/\r?\n/)
      .map(l => normalizeName(l))
      .filter(l => l && !l.startsWith("//"));
    
    // ✅ Keep helpful first line always visible
    select.innerHTML = `
      <option value="" disabled selected>
        ✨ Select a song from below by pressing here, then press ▶️ Play below.
      </option>
    `;

    window.songURLs = {}; // 🌍 Global map for song URLs
    const seen = new Set();

    // --- Helper: find star level (from window.star) ---
    function getStarLevel(songName) {
      if (!window.star) return null;
      for (const s of window.star) {
        const trimmed = s.trim();
        let level = null;
        let clean = trimmed;

        if (trimmed.startsWith("***")) {
          level = 3; clean = trimmed.replace(/^\*\*\*\s*/, "");
        } else if (trimmed.startsWith("**")) {
          level = 2; clean = trimmed.replace(/^\*\*\s*/, "");
        } else if (trimmed.startsWith("*")) {
          level = 1; clean = trimmed.replace(/^\*\s*/, "");
        } else if (trimmed.startsWith("#")) {
          level = 0; clean = trimmed.replace(/^#\s*/, "");
        }

        if (normalizeName(clean) === songName) return level;
      }
      return null;
    }

    // --- Build dropdown + URL map ---
    let count = 0;
    for (const rawLine of lines) {
      const songName = normalizeName(rawLine);
      if (seen.has(songName)) continue; // skip duplicates
      seen.add(songName);

      const encoded = encodeURIComponent(songName);
      const vocalURL = `${R2_BASE_URL}${encoded}_vocal.mp3`;
      const accURL = `${R2_BASE_URL}${encoded}_acc.mp3`;

      window.songURLs[songName] = { vocalURL, accURL };
      const opt = document.createElement("option");
      opt.value = songName;

      // ⭐ Apply visual level
      const level = getStarLevel(songName);
      if (level === 3) {
        opt.textContent = "★★★ " + songName;
        opt.style.color = "#27ae60";
        opt.style.fontWeight = "bold";
      } else if (level === 2) {
        opt.textContent = "★★ " + songName;
        opt.style.color = "orange";
        opt.style.fontWeight = "bold";
      } else if (level === 1) {
        opt.textContent = "★ " + songName;
        opt.style.color = "black";
        opt.style.fontWeight = "bold";
      } else if (level === 0) {
        opt.textContent = "# " + songName;
        opt.style.color = "gray";
        opt.style.fontWeight = "bold";
      } else {
        opt.textContent = songName;
      }

      select.appendChild(opt);
      count++;
    }

    console.log(`✅ ${count} unique songs loaded from R2.`);
    console.log("📦 window.songURLs ready with bilingual normalized keys.");

    // 🟢 After songs loaded, refresh bookmark marks
    refreshBookmarkDisplay();

  } catch (err) {
    console.error("❌ songNamesLoader.js: Error loading song names:", err);
  }
}

// Ensure this runs before anything else
window.addEventListener("DOMContentLoaded", loadSongNames);


/* -------------------------------------------------------------------
   ⭐ Integrated Simple Bookmark System (added safely at the end)
   ------------------------------------------------------------------- */

// ✅ Get bookmarks from localStorage
function getBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarkedSongs") || "[]");
}

// ✅ Save bookmarks to localStorage
function saveBookmarks(list) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(list));
}

// ✅ Toggle bookmark for selected song
function toggleBookmark(songName) {
  if (!songName) return;
  let list = getBookmarks();
  if (list.includes(songName)) {
    list = list.filter(s => s !== songName);
  } else {
    list.push(songName);
  }
  saveBookmarks(list);
  refreshBookmarkDisplay();
  updateBookmarkButton(songName);
}

// ✅ Refresh dropdown stars (★ for bookmarked)
function refreshBookmarkDisplay() {
  const select = document.getElementById("songSelect");
  if (!select) return;
  const list = getBookmarks();
  for (const opt of select.options) {
    const name = opt.value;
    if (!name) continue;
    const baseText = opt.textContent.replace(/^★\s*/, "");
    if (list.includes(name)) {
      if (!baseText.startsWith("★")) opt.textContent = "★ " + baseText;
    } else {
      opt.textContent = baseText.replace(/^★\s*/, "");
    }
  }
  const current = select.value;
  updateBookmarkButton(current);
}

// ✅ Change ☆ → ★ dynamically based on selection
function updateBookmarkButton(songName) {
  const btn = document.getElementById("bookmarkBtn");
  if (!btn || !songName) return;
  const list = getBookmarks();
  btn.textContent = list.includes(songName) ? "★" : "☆";
}

// ✅ Optional: Show only bookmarked songs
let showingOnlyBookmarked = false;

function toggleBookmarkView() {
  const select = document.getElementById("songSelect");
  const list = getBookmarks();
  showingOnlyBookmarked = !showingOnlyBookmarked;

  for (const opt of select.options) {
    if (!opt.value) continue;
    if (showingOnlyBookmarked && !list.includes(opt.value)) {
      opt.style.display = "none";
    } else {
      opt.style.display = "block";
    }
  }

  const btn = document.getElementById("bookmarkFilterBtn");
  if (btn) {
    btn.textContent = showingOnlyBookmarked ? "📚 Show All Songs" : "🎯 Show Bookmarked";
  }
}

// ✅ Keep bookmark icon in sync when user changes song
document.addEventListener("change", (e) => {
  if (e.target.id === "songSelect") {
    updateBookmarkButton(e.target.value);
  }
});




// ---------------------------
// ⭐ Simple Bookmark System
// ---------------------------


function loadBookmarks() {
  try {
    const raw = localStorage.getItem("bookmarkedSongs");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("⚠️ loadBookmarks() failed:", e);
    return [];
  }
}





function saveBookmarks(list) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(list));
}

// Toggle bookmark (add/remove)
window.toggleBookmark = function(songName) {
  if (!songName) return alert("⚠️ Please select a song first.");
  const btn = document.getElementById("bookmarkBtn");
  let bookmarks = loadBookmarks();

  if (bookmarks.includes(songName)) {
    // remove
    bookmarks = bookmarks.filter(s => s !== songName);
    btn.textContent = "☆";
  } else {
    // add
    bookmarks.push(songName);
    btn.textContent = "★";
  }

  saveBookmarks(bookmarks);
  console.log("⭐ Updated bookmarks:", bookmarks);
};

// Toggle between all songs and bookmarked-only view
let showingBookmarks = false;
window.toggleBookmarkView = function() {
  const btn = document.getElementById("bookmarkFilterBtn");
  const select = document.getElementById("songSelect");
  const allOptions = [...select.options];
  const bookmarks = loadBookmarks();

  if (!showingBookmarks) {
    // filter
    for (const opt of allOptions) {
      if (opt.value && !bookmarks.includes(opt.value)) opt.style.display = "none";
    }
    btn.textContent = "📚 Show All Songs";
    showingBookmarks = true;
  } else {
    // show all
    for (const opt of allOptions) {
      opt.style.display = "block";
    }
    btn.textContent = "🎯 Show Bookmarked";
    showingBookmarks = false;
  }
};

// When a song is selected, show correct star
document.getElementById("songSelect").addEventListener("change", () => {
  const select = document.getElementById("songSelect");
  const btn = document.getElementById("bookmarkBtn");
  const bookmarks = loadBookmarks();
  const song = select.value;
  btn.textContent = bookmarks.includes(song) ? "★" : "☆";
});
