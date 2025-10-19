
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
      const trimmedName = name.trim();

      const option = document.createElement("option");
      option.value = trimmedName;
      option.textContent = trimmedName;

      // ✅ Check if favorite
      const isGreen = window.green && window.green.includes(trimmedName);
      if (isGreen) {
        option.style.fontWeight = "bold";
        option.style.color = "#27ae60"; // pleasing green
      }

      select.appendChild(option);
    }

    console.log("✅ Tamil song names loaded into dropdown");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}

*/



// songNamesLoader.js
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
      const trimmedName = name.trim();
      const option = document.createElement("option");
      option.value = trimmedName;

      // ✅ Check if in star favorites
      const isStar = window.star && star.includes(trimmedName);
      if (isStar) {
        // Desktop: style bold + green
        option.style.fontWeight = "bold";
        option.style.color = "#27ae60";

        // Mobile-safe indicator
        const starCount = 3;
        option.textContent = "★".repeat(starCount) + " " + trimmedName;
        /*
        option.textContent = "★ " + trimmedName;
        */
      } else {
        option.textContent = trimmedName;
      }

      select.appendChild(option);
    }

    console.log("✅ Tamil song names loaded into dropdown");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}


