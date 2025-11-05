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

    select.innerHTML = "";
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
  
    // 🪄 Update bookmark star for the initially selected song (if any)
    updateBookmarkButtonState(select.value);
  
  
  } catch (err) {
    console.error("❌ songNamesLoader.js: Error loading song names:", err);
  }
}

// ✅ Insert the helper function RIGHT HERE (after loadSongNames)
function updateBookmarkButtonState(selectedSong) {
  if (typeof loadBookmarks !== "function") return; // bookmarksManager.js not yet ready
  const bookmarks = loadBookmarks();
  const btn = document.getElementById("bookmarkBtn");
  if (!btn) return;
  btn.textContent = bookmarks[selectedSong] ? "★" : "☆";
}



// Ensure this runs before anything else
window.addEventListener("DOMContentLoaded", loadSongNames);



// 🪄 Update bookmark star whenever song changes
window.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("songSelect");
  if (!select) return;

  select.addEventListener("change", () => {
    const current = select.value;
    updateBookmarkButtonState(current);
  });
});
