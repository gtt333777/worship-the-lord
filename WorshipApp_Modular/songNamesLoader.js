
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
