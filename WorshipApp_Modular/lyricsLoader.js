// === Lyrics Loader ===

function generatePrefixFromTamilName(name) {
  return name
    .normalize("NFD")                      // Normalize Unicode
    .replace(/[^\u0000-\u007F]/g, "")     // Remove non-ASCII (Tamil etc.)
    .replace(/[\s\W]+/g, "_")             // Replace spaces and punctuation with _
    .replace(/_+/g, "_")                  // Collapse multiple underscores
    .replace(/^_+|_+$/g, "")              // Trim leading/trailing _
    .toLowerCase();
}

async function loadLyricsForSelectedSong(optionElement) {
  const rawName = optionElement.value;
  console.log("🎵 Selected song name:", rawName);

  const prefix = generatePrefixFromTamilName(rawName);
  const lyricsFile = `lyrics/${prefix}.txt`;
  console.log("📄 Trying to load lyrics from:", lyricsFile);

  try {
    const response = await fetch(lyricsFile);
    if (!response.ok) throw new Error("Lyrics not found");
    const text = await response.text();
    document.getElementById("lyricsText").value = text;
    console.log("✅ Lyrics loaded successfully");
  } catch (err) {
    console.error("❌ Error loading lyrics:", err);
    document.getElementById("lyricsText").value = "Lyrics not found.";
  }
}
