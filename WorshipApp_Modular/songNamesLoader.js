
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
// Custom two-line dropdown (Tamil + English)
// =======================================================

async function loadSongNames() {
  try {
    // 1️⃣ Fetch the text file containing song names
    const res = await fetch("lyrics/songs_names.txt");
    const nameText = await res.text();

    // 2️⃣ Split lines, clean up
    const lines = nameText.split("\n").map(l => l.trim()).filter(l => l);

    // 3️⃣ Get dropdown container elements
    const list = document.getElementById("songDropdownList");
    const btn = document.getElementById("songDropdownBtn");

    if (!list || !btn) {
      console.error("❌ songDropdownList or songDropdownBtn not found in DOM");
      return;
    }

    // 4️⃣ Clear existing items
    list.innerHTML = "";

    // 5️⃣ Build dropdown items (Tamil + English on two lines)
    for (let i = 0; i < lines.length; i += 2) {
      const tamil = lines[i] || "";
      const english = lines[i + 1] || "";

      const item = document.createElement("div");
      item.innerHTML = `
        <div style="
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
          white-space: pre-line;
          line-height: 1.4;
          cursor: pointer;
        ">
          <strong>${tamil}</strong><br>
          <span style="color:#555;">${english}</span>
        </div>
      `;

      // 6️⃣ Click event to load lyrics
      item.addEventListener("click", () => {
        btn.textContent = `🎵 ${tamil}`;
        list.style.display = "none";
        loadLyricsForSelectedSong({ value: tamil });
      });

      list.appendChild(item);
    }

    // 7️⃣ Toggle dropdown open/close
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent immediate close
      list.style.display = list.style.display === "block" ? "none" : "block";
    });

    // 8️⃣ Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!list.contains(e.target) && e.target !== btn) {
        list.style.display = "none";
      }
    });

    console.log("✅ Song dropdown list built successfully");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}






// =======================================================
// 🔧 Fix for two-line song recognition (Tamil + English)
// =======================================================

window.getSongIdFromTamil = function(tamilName) {
  // Trim to avoid trailing spaces
  return tamilName.trim();
};

// Override loader to use Tamil → filename mapping
window.loadLyricsForSelectedSong = async function(selectLike) {
  try {
    const tamilName = selectLike?.value?.trim();
    if (!tamilName) {
      console.warn("⚠ No song name provided to loadLyricsForSelectedSong()");
      return;
    }

    // 🧩 Map to filename-friendly format
    const songId = getSongIdFromTamil(tamilName);

    const lyricsPath = `lyrics/${songId}.txt`;
    const vocalPath  = `audio/${songId}_vocal.mp3`;
    const accompPath = `audio/${songId}_accomp.mp3`;

    console.log("🎵 Loading files:", { lyricsPath, vocalPath, accompPath });

    // --- Load lyrics ---
    const lyricsRes = await fetch(lyricsPath);
    if (!lyricsRes.ok) throw new Error(`Lyrics not found: ${lyricsPath}`);
    const lyricsText = await lyricsRes.text();

    const lyricsBox = document.getElementById("lyricsArea");
    if (lyricsBox) lyricsBox.value = lyricsText;
    else console.error("❌ lyricsArea not found in DOM");

    // --- Load audio files globally ---
    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.src = vocalPath;
      window.accompAudio.src = accompPath;
      console.log("🎧 Audio sources updated");
    } else {
      console.warn("⚠ Global audio elements not ready yet");
    }
  } catch (err) {
    console.error("❌ Error loading song files:", err);
  }
};
