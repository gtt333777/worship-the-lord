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

        if (trimmed.startsWith("***")) { level = 3; clean = trimmed.replace(/^\*\*\*\s*/, ""); }
        else if (trimmed.startsWith("**")) { level = 2; clean = trimmed.replace(/^\*\*\s*/, ""); }
        else if (trimmed.startsWith("*")) { level = 1; clean = trimmed.replace(/^\*\s*/, ""); }
        else if (trimmed.startsWith("#")) { level = 0; clean = trimmed.replace(/^#\s*/, ""); }

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
      } else if (level === 2) {
        opt.textContent = "★★ " + songName;
        opt.style.color = "orange";
      } else if (level === 1) {
        opt.textContent = "★ " + songName;
        opt.style.color = "black";
      } else if (level === 0) {
        opt.textContent = "# " + songName;
        opt.style.color = "gray";
      } else {
        opt.textContent = songName;
      }
      opt.style.fontWeight = "bold";

      select.appendChild(opt);
      count++;
    }

    console.log(`✅ ${count} unique songs loaded.`);
    const currentSong = select.value;
    if (currentSong) updateBookmarkButton(currentSong);
  } catch (err) {
    console.error("❌ songNamesLoader.js: Error loading song names:", err);
  }
}

window.addEventListener("DOMContentLoaded", loadSongNames);

/* -------------------------------------------------------------------
   ⭐ Bookmark System
------------------------------------------------------------------- */

function loadBookmarks() {
  try {
    const raw = localStorage.getItem("bookmarkedSongs");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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
------------------------------------------------------------------- */

let showingBookmarks = false;
let collapsedGuide = false;

function collapseFilterButtonGuide(btn) {
  btn.dataset.wasText = btn.textContent;
  btn.dataset.wasBg = btn.style.background || "";
  btn.dataset.wasColor = btn.style.color || "";
  btn.dataset.wasWeight = btn.style.fontWeight || "";

  btn.style.transition = "transform 0.18s ease, background 0.3s ease, color 0.3s ease";
  btn.style.transform = "translateY(6px) scale(0.96)";
  btn.style.background = "linear-gradient(to bottom right, #e0e0e0, #f5f5f5)";
  btn.style.color = "#333";
  btn.style.fontWeight = "600";
  btn.textContent = "▲ Tap the list above";
  btn.disabled = true;
  btn.style.opacity = "0.7";
  btn.style.cursor = "not-allowed";
  collapsedGuide = true;
}

function restoreFilterButton(btn) {
  if (!collapsedGuide) return;
  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.cursor = "pointer";
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
  let bookmarks = loadBookmarks();
  const firstOption = select.options[0];

  // ✅ Only trigger encouragement when switching to "Show Bookmarked"
  if (!showingBookmarks && bookmarks.length === 0) {
    alert("🌟 Start bookmarking a song by pressing the star (☆) at left so it turns Gold.\nI’m making the first bookmark for you!");
    const firstSong = select.options.length > 1 ? select.options[1].value : null;
    if (firstSong) {
      bookmarks = [firstSong];
      saveBookmarks(bookmarks);
      console.log("🌟 Auto-bookmarked:", firstSong);
    }
    // Force showing all songs mode next
    showingBookmarks = false;
  }

  // Smooth fade for button state
  btn.style.transition = "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.18s ease";

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

  // Reset dropdown
  select.selectedIndex = 0;
  select.blur();

  // Collapse + disable temporarily
  collapseFilterButtonGuide(btn);
  try { select.focus(); } catch {}

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
   🪶 Smooth transitions setup + initial color
------------------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("bookmarkBtn");
  const filterBtn = document.getElementById("bookmarkFilterBtn");

  if (btn) btn.style.transition = "all 0.3s ease";

  if (filterBtn) {
    filterBtn.style.transition =
      "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.18s ease";
    // Initial orange state
    filterBtn.textContent = "🎯 Show Bookmarked";
    filterBtn.style.background = "linear-gradient(to bottom right, #ffcc33, #ff9900)";
    filterBtn.style.color = "black";
    filterBtn.style.fontWeight = "bold";
    filterBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
    filterBtn.style.border = "none";
    filterBtn.style.borderRadius = "8px";
    filterBtn.style.padding = "6px 12px";
    filterBtn.style.cursor = "pointer";
  }
});
