function getPrefixForTamilName(tamilName) {
  const txtFiles = window.availableTxtFiles || [];

  for (const file of txtFiles) {
    if (file.endsWith(".txt") && file.includes(tamilName)) {
      return file.replace(".txt", "");
    }
  }

  console.error("❌ Prefix not found for selected Tamil name");
  return "";
}

async function loadLyricsForSelectedSong(selectElement) {
  const tamilName = selectElement.value;
  console.log("🎵 Selected song name:", tamilName);

  const prefix = getPrefixForTamilName(tamilName);
  if (!prefix) {
    document.getElementById("lyricsText").value = "Lyrics not found.";
    return;
  }

  const lyricsPath = `lyrics/${prefix}.txt`;
  console.log("📖 Trying to load lyrics from:", lyricsPath);

  try {
    const response = await fetch(lyricsPath);
    if (!response.ok) throw new Error("Lyrics not found");

    const text = await response.text();
    document.getElementById("lyricsText").value = text;
  } catch (err) {
    console.error("❌ Error loading lyrics:", err);
    document.getElementById("lyricsText").value = "Lyrics not found.";
  }
}
