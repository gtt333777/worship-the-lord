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

window.toggleBookmark = function (songName) {
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
};


/* -------------------------------------------------------------------
   💛 Favorite System
------------------------------------------------------------------- */

function loadFavorites() {
  try {
    const raw = localStorage.getItem("favoriteSongs");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem("favoriteSongs", JSON.stringify(list));
}

window.toggleFavorite = function (songName) {
  if (!songName) return alert("⚠️ Please select a song first.");

  const btn = document.getElementById("favoriteBtn");
  let favs = loadFavorites();

  if (favs.includes(songName)) {
    favs = favs.filter(s => s !== songName);
    btn.textContent = "☆";
    btn.style.color = "black";
    btn.style.fontSize = "1.4rem";
  } else {
    favs.push(songName);
    btn.textContent = "★";
    btn.style.color = "gold";
    btn.style.fontSize = "1.7rem";
  }

  saveFavorites(favs);
};


/* -------------------------------------------------------------------
   🧭 Song List View Mode (ONE source of truth)
------------------------------------------------------------------- */

let currentView = "all"; // "all" | "bookmark" | "favorite"


/* -------------------------------------------------------------------
   🪟 Apply Song View (FOOLPROOF)
------------------------------------------------------------------- */
function applySongView(view) {
  const select = document.getElementById("songSelect");
  if (!select) return;

  const bookmarks = loadBookmarks();
  const favorites = loadFavorites();

  for (const opt of select.options) {
    if (!opt.value) {
      opt.style.display = "block";
      continue;
    }

    if (view === "bookmark") {
      opt.style.display = bookmarks.includes(opt.value) ? "block" : "none";
    } else if (view === "favorite") {
      opt.style.display = favorites.includes(opt.value) ? "block" : "none";
    } else {
      opt.style.display = "block";
    }
  }

  // Reset selection
  select.selectedIndex = 0;

  // 🔔 Update guide text
  const guideOption = select.options[0];
  if (guideOption) {
    guideOption.textContent = "⬆ Tap here to choose a song";
  }

  // ✨ Gentle highlight to guide user
  select.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.6)";
  setTimeout(() => {
    select.style.boxShadow = "";
  }, 1200);
}

/*


/* -------------------------------------------------------------------
   🎯 Bookmark Filter Button (FINAL CLEAN VERSION)
------------------------------------------------------------------- */

window.toggleBookmarkView = function () {
    const btn = document.getElementById("bookmarkFilterBtn");
    const favBtn = document.getElementById("favoriteFilterBtn");

    if (currentView === "bookmark") {
        currentView = "all";
        btn.innerHTML = "🎯 Show Bookmarked (Touch ⭐ above)";
        btn.classList.remove("filter-active");
    } else {
        currentView = "bookmark";
        btn.innerHTML = "✅ Bookmarked Only (Touch ⭐ above)";
        btn.classList.add("filter-active");

        favBtn.classList.remove("filter-active");
        favBtn.innerHTML = "💛 Show Favorites (Touch ⭐ above)";
    }

    applySongView(currentView);
};







/* -------------------------------------------------------------------
   💛 Favorite Filter Button (with helper hint)
------------------------------------------------------------------- */

    window.toggleFavoriteView = function () {
        const btn = document.getElementById("favoriteFilterBtn");
        const bmBtn = document.getElementById("bookmarkFilterBtn");

        if (currentView === "favorite") {
            currentView = "all";
            btn.innerHTML =
                "💛 Show Favorites (Touch ⭐ above)";
            btn.classList.remove("filter-active");
        } else {
            currentView = "favorite";
            btn.innerHTML =
                "💛 Favorites Only (Touch ⭐ above)";
            btn.classList.add("filter-active");

            bmBtn.classList.remove("filter-active");
            bmBtn.innerHTML =
                "🎯 Show Bookmarked (Touch ⭐ above)";
        }

        applySongView(currentView);
};






/* -------------------------------------------------------------------
   🔄 Update Stars when Song Changes
------------------------------------------------------------------- */

document.getElementById("songSelect").addEventListener("change", () => {
  const song = document.getElementById("songSelect").value;

  // Bookmark star
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const bookmarks = loadBookmarks();
  if (bookmarkBtn) {
    if (bookmarks.includes(song)) {
      bookmarkBtn.textContent = "★";
      bookmarkBtn.style.color = "gold";
      bookmarkBtn.style.fontSize = "1.9rem";
    } else {
      bookmarkBtn.textContent = "☆";
      bookmarkBtn.style.color = "black";
      bookmarkBtn.style.fontSize = "1.6rem";
    }
  }

  // Favorite star
  const favoriteBtn = document.getElementById("favoriteBtn");
  const favs = loadFavorites();
  if (favoriteBtn) {
    if (favs.includes(song)) {
      favoriteBtn.textContent = "★";
      favoriteBtn.style.color = "gold";
      favoriteBtn.style.fontSize = "1.7rem";
    } else {
      favoriteBtn.textContent = "☆";
      favoriteBtn.style.color = "black";
      favoriteBtn.style.fontSize = "1.4rem";
    }
  }
});






/* ==========================================================
   🔁 Auto Play (Resume from where left) — SEGMENT SAFE
   ========================================================== */

window.autoPlayEnabled = false;

// Toggle Auto Play button
window.toggleAutoPlay = function () {
  const btn = document.getElementById("autoPlayBtn");
  if (!btn) return;

  window.autoPlayEnabled = !window.autoPlayEnabled;

  if (window.autoPlayEnabled) {
    btn.innerHTML = "🔁 Auto Play<br>(On)";
    btn.style.background = "linear-gradient(to bottom right, #66bb6a, #2e7d32)";
    console.log("🔁 Auto Play ENABLED");
  } else {
    btn.innerHTML = "🔁 Auto Play";
    btn.style.background = "linear-gradient(to bottom right, #81c784, #4caf50)";
    console.log("⏹ Auto Play DISABLED");
  }
};

// Attach click handler once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("autoPlayBtn");
  if (btn) btn.onclick = window.toggleAutoPlay;
});

// Helper: get visible song list (respects All / Bookmark / Favorite)
function getVisibleSongList() {
  const select = document.getElementById("songSelect");
  if (!select) return [];

  return [...select.options]
    .filter(opt => opt.value && opt.style.display !== "none")
    .map(opt => opt.value);
}

// ⭐ CORE: listen to REAL song completion (from loopPlayer.js)
window.addEventListener("songFinished", () => {
  if (!window.autoPlayEnabled) return;

  const select = document.getElementById("songSelect");
  if (!select) return;

  const visibleSongs = getVisibleSongList();
  const currentSong = select.value;
  const idx = visibleSongs.indexOf(currentSong);

  // End of list → turn off Auto Play gracefully
  if (idx === -1 || idx + 1 >= visibleSongs.length) {
    console.log("🏁 Auto Play reached end of list");

    window.autoPlayEnabled = false;

    const btn = document.getElementById("autoPlayBtn");
    if (btn) {
      btn.innerHTML = "🔁 Auto Play";
      btn.style.background = "linear-gradient(to bottom right, #81c784, #4caf50)";
    }
    return;
  }

  // ▶ Play next song
  const nextSong = visibleSongs[idx + 1];
  console.log("▶ Auto Play next song:", nextSong);

  select.value = nextSong;
  select.dispatchEvent(new Event("change"));

  // Small delay, then press Play
  setTimeout(() => {
    document.getElementById("playBtn")?.click();
  }, 400);
});




/* -------------------------------------------------------------------
   🔁 Force ONE-TIME FULL PAGE RELOAD on FIRST Dropdown Interaction
   (Mobile-safe, prevents prelude bug)
------------------------------------------------------------------- */

(function forceOneTimeReloadOnDropdownClick() {
  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("songSelect");
    if (!select) return;

    // Prevent infinite reload loop using sessionStorage
    const hasReloaded = sessionStorage.getItem("songDropdownReloaded");

    if (!hasReloaded) {
      select.addEventListener("click", () => {
        console.log("🔄 First dropdown click → forcing full reload");

        sessionStorage.setItem("songDropdownReloaded", "yes");

        // Let click finish, then reload
        setTimeout(() => {
          location.reload();
        }, 0);
      });
    }
  });
})();
