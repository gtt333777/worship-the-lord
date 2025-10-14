
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
// songNamesLoader.js
// Loads Tamil + English song names into dropdown and highlights favorites
// =======================================================

async function loadSongNames() {
  try {
    // --- Load favorite songs from favoriteSongs.js ---
    // window.favoriteSongs should already be defined in favoriteSongs.js
    const favoriteSongs = window.favoriteSongs || [];

    // --- Get list of .txt files in lyrics/ folder (optional, for reference) ---
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;

    // --- Load Tamil + English names from songs_names.txt ---
    const nameRes = await fetch("lyrics/songs_names.txt");
    const nameText = await nameRes.text();
    const lines = nameText.split("\n").map(l => l.trim()).filter(l => l);

    const select = document.getElementById("songSelect");
    select.innerHTML = "";

    for (let i = 0; i < lines.length; i += 2) {
      const tamilLine = lines[i] || "";
      const englishLine = lines[i + 1] || "";

      const option = document.createElement("option");
      option.value = tamilLine;
      option.textContent = `${tamilLine} — ${englishLine}`;
      select.appendChild(option);
    }

    // --- Create dropdown list with clickable items ---
    const dropdownList = document.getElementById("songDropdownList");
    if (dropdownList) dropdownList.innerHTML = "";

    for (let i = 0; i < lines.length; i += 2) {
      const tamilLine = lines[i] || "";
      const englishLine = lines[i + 1] || "";

      const item = document.createElement("div");

      // ✅ Highlight favorites in pleasing green
      const isFavorite = favoriteSongs.includes(tamilLine);
      item.innerHTML = `
        <div style="
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          font-weight: ${isFavorite ? "bold" : "normal"};
          color: ${isFavorite ? "#27ae60" : "#222"};  /* Pleasing green */
        ">
          <div>${tamilLine}</div>
          <div style="color:#555;">${englishLine}</div>
        </div>
      `;

      item.addEventListener("click", () => {
        const dropdownBtn = document.getElementById("songDropdownBtn");
        if (dropdownBtn) dropdownBtn.textContent = `🎵 ${tamilLine}`;
        if (dropdownList) dropdownList.style.display = "none";

        // Call lyrics loader
        loadLyricsForSelectedSong({ value: tamilLine });
      });

      if (dropdownList) dropdownList.appendChild(item);
    }

    // --- Toggle dropdown on button click ---
    const dropdownBtn = document.getElementById("songDropdownBtn");
    if (dropdownBtn && dropdownList) {
      dropdownBtn.addEventListener("click", () => {
        dropdownList.style.display = dropdownList.style.display === "block" ? "none" : "block";
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (dropdownList && !dropdownList.contains(e.target) && e.target !== dropdownBtn) {
        dropdownList.style.display = "none";
      }
    });

    console.log("✅ Song names loaded with favorites highlighted in green");

  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}
