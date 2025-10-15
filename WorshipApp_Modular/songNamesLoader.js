
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
