// === LOAD LYRICS FOR SELECTED SONG ===

async function loadLyrics(tamilName) {
  try {
    const response = await fetch("lyrics/songs_names.txt");
    const text = await response.text();
    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

    let prefix = null;
    for (const line of lines) {
      const parts = line.split("=");
      if (parts.length !== 2) continue;  // ✅ Skip malformed lines
      const [pfx, name] = parts;
      if (name.trim() === tamilName.trim()) {
        prefix = pfx.trim();
        break;
      }
    }

    if (!prefix) {
      throw new Error("Prefix not found for selected song!");
    }

    const lyricsResponse = await fetch(`lyrics/${prefix}.txt`);
    const lyricsText = await lyricsResponse.text();

    const lyricsArea = document.getElementById("lyricsArea");
    if (lyricsArea) {
      lyricsArea.value = lyricsText;
      console.log("Lyrics loaded successfully!");
    } else {
      console.warn("lyricsArea not found.");
    }

  } catch (err) {
    console.error("Error loading lyrics:", err);
    alert("Error loading lyrics: " + err.message);
  }
}
