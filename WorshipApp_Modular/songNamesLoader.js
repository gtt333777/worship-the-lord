
/*
async function loadSongNames() {
  try {
    // Get list of .txt files in lyrics/ folder
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;

    // Load Tamil names from songs_names.txt
    const nameRes = await fetch("lyrics/songs_names.txt");
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n");

    const select = document.getElementById("songSelect");
    select.innerHTML = "";
    
    for (const name of songNames) {
      const option = document.createElement("option");
      option.value = name.trim();
      option.textContent = name.trim();
      select.appendChild(option);
    }
    


    console.log("✅ Tamil song names loaded into dropdown");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}


*/



// =======================================================
// WorshipApp_Modular/songNamesLoader.js
// Loads song names and populates dropdown
// =======================================================
/*
async function loadSongNames() {
  try {
    // --- Get list of .txt files in lyrics/ folder (for debugging) ---
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;

    // --- Load Tamil names from songs_names.txt ---
    const nameRes = await fetch("lyrics/songs_names.txt");
    if (!nameRes.ok) throw new Error("songs_names.txt not found!");
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n").map(x => x.trim()).filter(Boolean);

    // --- Populate dropdown ---
    const select = document.getElementById("songSelect");
    if (!select) {
      console.error("❌ <select id='songSelect'> not found in HTML.");
      return;
    }

    select.innerHTML = "";
    songNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      
      select.appendChild(option);
    });

    console.log(`✅ Loaded ${songNames.length} Tamil song names into dropdown`);
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}

*/


/*
// --- Apply styles from songNames.js ---
function updateSongDisplayStyled() {
    const select = document.getElementById('songSelect');
    const display = document.getElementById('songDisplay');
    if (!select || !display) return;

    const selectedValue = select.value;
    const songObj = window.songNames.find(s => s.file === selectedValue);
    if (!songObj) return;

    const taHTML = `<span style="${songObj.style || ''}">${songObj.ta}</span>`;
    const enHTML = `<span style="${songObj.style || ''}; font-size:0.85em; color:#666;">${songObj.en}</span>`;

    display.innerHTML = `${taHTML}<br>${enHTML}`;
}

// --- Call whenever dropdown changes ---
const sel = document.getElementById('songSelect');
if (sel) {
    sel.addEventListener('change', updateSongDisplayStyled);
}

// --- Initial display on page load ---
window.addEventListener('DOMContentLoaded', updateSongDisplayStyled);
*/




// WorshipApp_Modular/songNamesLoader.js
// Loads songNames from song_names.js (if present) OR falls back to songs_names.txt
// Populates dropdown with option.value = fileKey (safe ASCII).
// Also wires updateSongDisplayStyled() to show styled Tamil + English lines.

(function() {
  // helper: make ASCII safe key from a string
  function makeFileKey(name) {
    if (!name) return "song_unknown";
    let k = String(name).trim().toLowerCase();
    k = k.replace(/\s+/g, "_");            // spaces -> underscore
    k = k.replace(/[^a-z0-9_-]/g, "");     // remove non-ascii chars
    k = k.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    return k || "song_unknown";
  }

  async function loadSongNames() {
    try {
      let list = [];

      // Prefer window.songNames if present and valid
      if (Array.isArray(window.songNames) && window.songNames.length) {
        list = window.songNames.map(item => {
          return {
            file: item.file ? String(item.file).trim() : makeFileKey(item.en || item.ta),
            ta: item.ta || "",
            en: item.en || "",
            style: item.style || "",      // optional CSS for Tamil
            enStyle: item.enStyle || ""   // optional CSS for English
          };
        });
      } else {
        // Fallback: load plain songs_names.txt (Tamil per-line)
        const resp = await fetch("lyrics/songs_names.txt");
        if (!resp.ok) throw new Error("songs_names.txt not found");
        const txt = await resp.text();
        const lines = txt.split("\n").map(l => l.trim()).filter(Boolean);
        list = lines.map(line => {
          return {
            file: makeFileKey(line),
            ta: line,
            en: ""
          };
        });
      }

      // Save canonical map for later (optional)
      window._SONG_KEY_MAP = window._SONG_KEY_MAP || {};
      list.forEach(s => (window._SONG_KEY_MAP[s.file] = s));

      // Populate dropdown (value = file key, text = Tamil)
      const select = document.getElementById("songSelect");
      if (!select) {
        console.error("❌ <select id='songSelect'> not found.");
        return;
      }

      // keep initial placeholder
      select.innerHTML = '<option value="">-- Select a Song --</option>';

      for (const s of list) {
        const opt = document.createElement("option");
        opt.value = s.file;
        opt.textContent = s.ta || s.file;
        // store metadata for convenience
        opt.dataset.en = s.en || "";
        opt.dataset.taStyle = s.style || "";
        opt.dataset.enStyle = s.enStyle || "";
        select.appendChild(opt);
      }

      console.log(`✅ Loaded ${list.length} song names into dropdown (via song_names.js).`);

      // wire change events:
      select.addEventListener("change", () => {
        // show styled display
        if (typeof updateSongDisplayStyled === "function") updateSongDisplayStyled();
        // load lyrics if you want automatic load on change (optional)
        if (typeof loadLyricsForSelectedSong === "function") loadLyricsForSelectedSong(select);
      });

      // show initial if any selected
      if (select.options.length > 1) {
        // optionally select first real song (index 1)
        // select.selectedIndex = 1;
        updateSongDisplayStyled();
      }
    } catch (err) {
      console.error("❌ loadSongNames error:", err);
    }
  }

  // expose
  window.loadSongNames = loadSongNames;
})();






// --- updateSongDisplayStyled() ---
// Shows Tamil (styled) on first line and English (smaller, gray by default) on second line.
function updateSongDisplayStyled() {
  const select = document.getElementById("songSelect");
  const display = document.getElementById("songDisplay");
  if (!select || !display) return;

  const key = select.value;
  if (!key) {
    display.innerHTML = "";
    return;
  }

  // Look up song info either from _SONG_KEY_MAP or window.songNames
  let songObj = (window._SONG_KEY_MAP && window._SONG_KEY_MAP[key]) || null;
  if (!songObj && Array.isArray(window.songNames)) {
    songObj = window.songNames.find(s => (s.file || "").toString() === key) || null;
  }

  // If not found, try reading dataset from selected option
  if (!songObj) {
    const opt = select.options[select.selectedIndex];
    if (opt) {
      songObj = {
        file: key,
        ta: opt.textContent || "",
        en: opt.dataset.en || "",
        style: opt.dataset.taStyle || "",
        enStyle: opt.dataset.enStyle || ""
      };
    }
  }

  if (!songObj) {
    display.innerHTML = "";
    return;
  }

  const taStyle = songObj.style || songObj.taStyle || "";
  const enStyle = songObj.enStyle || "font-size:0.9em; color:#666;";

  // Build HTML safely (we assume songNames are controlled by you)
  display.innerHTML =
    `<div style="${taStyle}">${songObj.ta || ""}</div>` +
    `<div style="${enStyle}">${songObj.en || ""}</div>`;
}
