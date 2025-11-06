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

    // Always start with helpful first line (not a song)
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
   + Collapse-button guidance to focus dropdown
------------------------------------------------------------------- */

let showingBookmarks = false;      // current filter
let collapsedGuide = false;        // whether button is in collapsed guidance state
let hintTimeoutId = null;

function ensureSelectHintElement() {
  // Create a small hint div above the select if not present.
  let hint = document.getElementById("songSelectHint");
  if (!hint) {
    hint = document.createElement("div");
    hint.id = "songSelectHint";
    hint.style.position = "relative";
    hint.style.margin = "6px 0 4px 0";
    hint.style.padding = "6px 8px";
    hint.style.fontSize = "0.95rem";
    hint.style.borderRadius = "6px";
    hint.style.background = "rgba(255,255,255,0.95)";
    hint.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
    hint.style.textAlign = "center";
    hint.style.opacity = "0";
    hint.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    hint.style.transform = "translateY(-4px)";
    hint.style.zIndex = "999";
    hint.textContent = "Tap here to choose a song";
    // insert before select
    const select = document.getElementById("songSelect");
    if (select && select.parentNode) {
      select.parentNode.insertBefore(hint, select);
    }
  }
  return hint;
}

function showSelectHintTransient() {
  const hint = ensureSelectHintElement();
  // reset timeout if exists
  if (hintTimeoutId) {
    clearTimeout(hintTimeoutId);
    hintTimeoutId = null;
  }
  hint.style.opacity = "1";
  hint.style.transform = "translateY(0)";
  // hide after 2.5s
  hintTimeoutId = setTimeout(() => {
    hint.style.opacity = "0";
    hint.style.transform = "translateY(-4px)";
    hintTimeoutId = null;
  }, 2500);
}

function collapseFilterButtonGuide(btn) {
  // visually "collapse" the filter button so it points up and invites the user
  btn.dataset.wasText = btn.textContent; // remember
  btn.dataset.wasBg = btn.style.background || "";
  btn.dataset.wasColor = btn.style.color || "";
  btn.dataset.wasWeight = btn.style.fontWeight || "";

  // collapsed look
  btn.style.transition = "transform 0.18s ease, background 0.3s ease, color 0.3s ease";
  btn.style.transformOrigin = "center";
  btn.style.transform = "translateY(6px) scale(0.98)";
  btn.style.background = "linear-gradient(to bottom right, #e0e0e0, #f6f6f6)";
  btn.style.color = "#222";
  btn.style.fontWeight = "600";
  btn.innerHTML = "▲ Tap the list above";

  collapsedGuide = true;
}

function restoreFilterButton(btn) {
  if (!collapsedGuide) return;
  // restore previous values saved in dataset
  btn.style.transform = "translateY(0) scale(1)";
  btn.style.background = btn.dataset.wasBg || "";
  btn.style.color = btn.dataset.wasColor || "";
  btn.style.fontWeight = btn.dataset.wasWeight || "";
  btn.textContent = btn.dataset.wasText || (showingBookmarks ? "📚 Show All Songs" : "🎯 Show Bookmarked");
  collapsedGuide = false;
}

window.toggleBookmarkView = function() {
  const btn = document.getElementById("bookmarkFilterBtn");
  const select = document.getElementById("songSelect");
  if (!btn || !select) return;

  const allOptions = [...select.options];
  const bookmarks = loadBookmarks();
  const firstOption = select.options[0];

  // Ensure smooth fade for button color
  btn.style.transition = "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.18s ease";

  // Toggle filter state
  if (!showingBookmarks) {
    // Show only bookmarked
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
    // Show all songs
    for (const opt of allOptions) opt.style.display = "block";

    btn.textContent = "🎯 Show Bookmarked";
    btn.style.background = "linear-gradient(to bottom right, #ffcc33, #ff9900)";
    btn.style.color = "black";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
    showingBookmarks = false;
  }

  // Reset dropdown selection to first line (never keep song selected)
  select.selectedIndex = 0;
  select.blur();

  // --- Collapse button + show hint to guide the user ---
  collapseFilterButtonGuide(btn);
  // show transient hint above the select
  showSelectHintTransient();
  // focus select so user can tap it easily (won't open native dropdown reliably on all mobile, but focuses)
  try { select.focus(); } catch (e) { /* ignore */ }

  // When user interacts with select (focus or change), restore the button
  const restoreOnce = () => {
    restoreFilterButton(btn);
    select.removeEventListener("focus", restoreOnce);
    select.removeEventListener("change", restoreOnce);
  };
  select.addEventListener("focus", restoreOnce);
  select.addEventListener("change", restoreOnce);
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
  if (filterBtn) filterBtn.style.transition = "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.18s ease";
});
