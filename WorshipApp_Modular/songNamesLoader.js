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

async function loadSongNames() {
  try {
    // Get list of .txt files in lyrics/ folder
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;

    // Load Tamil + English song names (2 lines per song)
    const nameRes = await fetch("lyrics/songs_names.txt");
    const nameText = await nameRes.text();

    // Split by lines, trim extra spaces, and filter out empty ones
    const lines = nameText.split("\n").map(l => l.trim()).filter(l => l);

    const select = document.getElementById("songSelect");
    select.innerHTML = "";

    // ✅ Each song has 2 lines: Tamil + English
    for (let i = 0; i < lines.length; i += 2) {
      const tamil = lines[i] || "";
      const english = lines[i + 1] || "";

      const option = document.createElement("option");
      option.value = tamil; // use Tamil line as key
      option.textContent = english ? `${tamil}\n${english}` : tamil;
      select.appendChild(option);
    }

    // ✅ Allow multi-line display inside dropdown
    select.style.whiteSpace = "pre-line";

    console.log("✅ Tamil + English song names loaded (2-line format)");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}
