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

    // ✅ Always start with helpful first line (not a song)
    select.innerHTML = `
      <option value="" disabled selected>
        ✨ Select a song from below by pressing here, then press ▶️ Play below.
      </option>
    `;

    window.songURLs = {};
    const seen = new Set();

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

    let count = 0;
    for (const rawLine of lines) {
      const songName = normalizeName(rawLine);
      if (seen.has(songName)) continue;
      seen.add(songName);

      const encoded = encodeURIComponent(songName);
      const vocalURL = `${R2_BASE_URL}${encoded}_vocal.mp3`;
      const accURL = `${R2_BASE_URL}${encoded}_acc.mp3`;
      window.songURLs[songName] = { vocalURL, accURL };

      const opt = document.createElement("option");
      opt.value = songName;

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

    console.log(`✅ ${count} unique songs loaded.`);
    console.log("📦 window.songURLs ready.");

    const currentSong = document.getElementById("songSelect")?.value;
    if (currentSong) updateBookmarkButton(currentSong);
  } catch (err) {
    console.error("❌ songNamesLoader.js: Error loading song names:", err);
  }
}

window.addEventListener("DOMContentLoaded", loadSongNames);

/* -------------------------------------------------------------------
   ⭐ Simple Bookmark System
------------------------------------------------------------------- */

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

window.toggleBookmark = function(songName) {
  if (!songName) return alert("⚠️ Please select a song first.");
  const btn = document.getElementById("bookmarkBtn");
  let bookmarks = loadBookmarks();

  if (bookmarks.includes(songName)) {
    bookmarks = bookmarks.filter(s => s !== songName);
    btn.textContent = "☆";
    btn.style.color = "black";
    btn.style.fontSize = "1.6rem";
  } else {
    bookmarks.push(songName);
    btn.textContent = "★";
    btn.style.color = "gold";
    btn.style.fontSize = "1.9rem";
  }

  saveBookmarks(bookmarks);
  console.log("⭐ Updated bookmarks:", bookmarks);
};

/* -------------------------------------------------------------------
   🎯 Toggle between All Songs / Bookmarked View
   + Smooth fade + dropdown first-line flash
------------------------------------------------------------------- */

let showingBookmarks = false;

window.toggleBookmarkView = function() {
  const btn = document.getElementById("bookmarkFilterBtn");
  const select = document.getElementById("songSelect");
  const allOptions = [...select.options];
  const bookmarks = loadBookmarks();
  const firstOption = select.options[0];

  // Ensure smooth fade for button color
  btn.style.transition = "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease";

  if (!showingBookmarks) {
    // 🔹 Show only bookmarked
    for (const opt of allOptions) {
      if (opt.value && !bookmarks.includes(opt.value)) opt.style.display = "none";
    }
    if (firstOption) firstOption.style.display = "block";

    btn.textContent = "📚 Show All Songs";
    btn.style.background = "linear-gradient(to bottom right, #1565c0, #0d47a1)";
    btn.style.color = "white";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    showingBookmarks = true;
  } else {
    // 🔹 Show all songs
    for (const opt of allOptions) opt.style.display = "block";

    btn.textContent = "🎯 Show Bookmarked";
    btn.style.background = "linear-gradient(to bottom right, #ffcc33, #ff9900)";
    btn.style.color = "black";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
    showingBookmarks = false;
  }

  // 🟢 Reset dropdown to first line
  select.selectedIndex = 0;
  select.blur();

  // ✨ Subtle fade flash on the first dropdown line
  if (firstOption) {
    firstOption.style.transition = "background-color 0.6s ease";
    firstOption.style.backgroundColor = "#fff3b0"; // soft light yellow
    setTimeout(() => {
      firstOption.style.backgroundColor = "transparent";
    }, 600);
  }
};

/* -------------------------------------------------------------------
   🪄 Update bookmark star when song changes
------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------
   🪶 Smooth transitions setup
------------------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("bookmarkBtn");
  const filterBtn = document.getElementById("bookmarkFilterBtn");
  if (btn) btn.style.transition = "all 0.3s ease";
  if (filterBtn) filterBtn.style.transition = "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease";
});
