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


    // 🟢 After songs loaded — no refreshBookmarkDisplay needed anymore
const currentSong = document.getElementById("songSelect")?.value;
if (currentSong) updateBookmarkButton(currentSong);


  } catch (err) {
    console.error("❌ songNamesLoader.js: Error loading song names:", err);
  }
}

// Ensure this runs before anything else
window.addEventListener("DOMContentLoaded", loadSongNames);


/* -------------------------------------------------------------------
   ⭐ Integrated Simple Bookmark System (plain gold star version)
   ------------------------------------------------------------------- */

// ✅ Safe load from localStorage
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

// ✅ Save to localStorage
function saveBookmarks(list) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(list));
}

// ⭐ Toggle bookmark for selected song (plain gold, no glow)
window.toggleBookmark = function(songName) {
  if (!songName) return alert("⚠️ Please select a song first.");
  const btn = document.getElementById("bookmarkBtn");
  let bookmarks = loadBookmarks();

  if (bookmarks.includes(songName)) {
    // 🔸 Remove
    bookmarks = bookmarks.filter(s => s !== songName);
    btn.textContent = "☆";
    btn.style.color = "black";
    btn.style.fontSize = "1.6rem";
  } else {
    // 🌟 Add
    bookmarks.push(songName);
    btn.textContent = "★";
    btn.style.color = "gold";
    btn.style.fontSize = "1.9rem";
  }

  saveBookmarks(bookmarks);
  console.log("⭐ Updated bookmarks:", bookmarks);
};


// 🎯 Toggle between all songs and bookmarked-only view (with blue highlight)
let showingBookmarks = false;
window.toggleBookmarkView = function() {
  const btn = document.getElementById("bookmarkFilterBtn");
  const select = document.getElementById("songSelect");
  const allOptions = [...select.options];
  const bookmarks = loadBookmarks();

  if (!showingBookmarks) {
    // 🔹 Show only bookmarked
    for (const opt of allOptions) {
      if (opt.value && !bookmarks.includes(opt.value)) opt.style.display = "none";
    }
    btn.textContent = "📚 Show All Songs";
    btn.style.background = "linear-gradient(to bottom right, #1976d2, #0d47a1)";
    btn.style.color = "white";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    showingBookmarks = true;
  } else {
    // 🔹 Show all
    for (const opt of allOptions) {
      opt.style.display = "block";
    }
    btn.textContent = "🎯 Show Bookmarked";
    btn.style.background = "";
    btn.style.color = "black";
    btn.style.fontWeight = "normal";
    btn.style.boxShadow = "none";
    showingBookmarks = false;
  }


  // 🪄 Bring dropdown into focus + smooth gold glow to signal update
select.focus();

// 🔍 Scroll currently selected song into view
const selectedIndex = select.selectedIndex;
if (selectedIndex > 0) {
  select.options[selectedIndex].scrollIntoView({ block: "nearest" });
}

// ✨ Smooth gold glow highlight (visually shows dropdown updated)
select.style.transition = "box-shadow 0.6s ease";
select.style.boxShadow = "0 0 14px 4px gold";
setTimeout(() => (select.style.boxShadow = "none"), 1500);


// 🌟 Highlight the first line to attract attention (mobile friendly)
const firstOption = select.options[0];
if (firstOption) {
  firstOption.style.transition = "all 0.6s ease";
  firstOption.style.background = "gold";
  firstOption.style.color = "black";
  firstOption.style.fontWeight = "bold";

setTimeout(() => {
  firstOption.style.transition = "all 1s ease";
  firstOption.style.background = "transparent";
  firstOption.style.color = "";
  firstOption.style.fontWeight = "";
}, 1500);

}


};





// 🪄 Update star when song changes
document.getElementById("songSelect").addEventListener("change", () => {
  const select = document.getElementById("songSelect");
  const btn = document.getElementById("bookmarkBtn");
  const bookmarks = loadBookmarks();
  const song = select.value;

  if (bookmarks.includes(song)) {
    btn.textContent = "★";
    btn.style.color = "gold";
    btn.style.fontSize = "1.9rem";
  } else {
    btn.textContent = "☆";
    btn.style.color = "black";
    btn.style.fontSize = "1.6rem";
  }
});

// 🪶 Add smooth transitions once loaded
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("bookmarkBtn");
  const filterBtn = document.getElementById("bookmarkFilterBtn");
  if (btn) btn.style.transition = "all 0.3s ease";
  if (filterBtn) filterBtn.style.transition = "all 0.25s ease";
});
