
// songNamesLoader.js
//This version detects the prefix (***, **, *, or #),
//matches the song name accordingly, and applies the style + visible symbol in the dropdown.

async function loadSongNames() {
  try {
    // 🔹 Get list of .txt files in lyrics/ folder
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;

    // 🔹 Load Tamil names from songs_names.txt
    const nameRes = await fetch("lyrics/songs_names.txt");
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n");

    const select = document.getElementById("songSelect");
    select.innerHTML = "";

    // 🔹 Helper: get star level of a song
    function getStarLevel(songName) {
      if (!window.star) return null;

      for (const s of window.star) {
        const trimmed = s.trim();
        let level = null;
        let cleanName = trimmed;

        if (trimmed.startsWith("***")) {
          level = 3;
          cleanName = trimmed.replace(/^\*\*\*\s*/, "");
        } else if (trimmed.startsWith("**")) {
          level = 2;
          cleanName = trimmed.replace(/^\*\*\s*/, "");
        } else if (trimmed.startsWith("*")) {
          level = 1;
          cleanName = trimmed.replace(/^\*\s*/, "");
        } else if (trimmed.startsWith("#")) {
          level = 0;
          cleanName = trimmed.replace(/^#\s*/, "");
        }

        if (cleanName === songName) return level;
      }
      return null;
    }

    // 🔹 Build dropdown
    for (const name of songNames) {
      const trimmedName = name.trim();
      const option = document.createElement("option");
      option.value = trimmedName;

      const level = getStarLevel(trimmedName);

      if (level === 3) {
        option.textContent = "★★★ " + trimmedName;
        option.style.color = "#27ae60"; // green
        option.style.fontWeight = "bold";
      } else if (level === 2) {
        option.textContent = "★★ " + trimmedName;
        option.style.color = "orange";
        option.style.fontWeight = "bold";
      } else if (level === 1) {
        option.textContent = "★ " + trimmedName;
        option.style.color = "black";
        option.style.fontWeight = "bold";
      } else if (level === 0) {
        option.textContent = "# " + trimmedName;
        option.style.color = "gray";
        option.style.fontWeight = "normal";
      } else {
        // normal song
        option.textContent = trimmedName;
        option.style.fontWeight = "normal";
      }

      select.appendChild(option);
    }

    console.log("✅ Tamil song names loaded into dropdown with star levels");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}
