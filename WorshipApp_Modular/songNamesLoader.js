
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
// Custom styled dropdown (no <select>)
// =======================================================

async function loadSongNames() {
  try {
    const res = await fetch("lyrics/");
    const html = await res.text();
    window.availableTxtFiles = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);

    const nameRes = await fetch("lyrics/songs_names.txt");
    if (!nameRes.ok) throw new Error("songs_names.txt not found!");
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n").map(x => x.trim()).filter(Boolean);

    buildCustomDropdown(songNames);
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}

// =======================================================
// Build custom dropdown UI
// =======================================================
function buildCustomDropdown(songNames) {
  const dropdownList = document.getElementById("dropdownList");
  const selectedDiv = document.getElementById("dropdownSelected");
  if (!dropdownList || !selectedDiv) return;

  dropdownList.innerHTML = "";

  songNames.forEach(name => {
    const songObj = window.songNames.find(s => s.ta === name);
    const style = songObj?.style || "";
    const en = songObj?.en || "";

    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.innerHTML = `
      <div style="${style}">${name}</div>
      <div style="font-size:0.85em; color:#666;">${en}</div>
    `;

    item.addEventListener("click", () => {
      selectedDiv.innerHTML = item.innerHTML;
      dropdownList.style.display = "none";

      if (typeof updateSongDisplayStyled === "function") updateSongDisplayStyledCustom(songObj);
      if (typeof loadLyricsForSelectedSong === "function") loadLyricsForSelectedSong({ value: name });
    });

    dropdownList.appendChild(item);
  });

  // Toggle open/close
  selectedDiv.addEventListener("click", () => {
    dropdownList.style.display = dropdownList.style.display === "block" ? "none" : "block";
  });

  // Close when clicking outside
  document.addEventListener("click", e => {
    if (!e.target.closest(".dropdown")) dropdownList.style.display = "none";
  });
}

// =======================================================
// Show selected song below dropdown
// =======================================================
function updateSongDisplayStyledCustom(songObj) {
  const display = document.getElementById("songDisplay");
  if (!display || !songObj) return;
  const taHTML = `<span style="${songObj.style || ''}">${songObj.ta}</span>`;
  const enHTML = `<span style="${songObj.style || ''}; font-size:0.85em; color:#666;">${songObj.en}</span>`;
  display.innerHTML = `${taHTML}<br>${enHTML}`;
}
