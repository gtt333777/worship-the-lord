function generatePrefixFromTamilName(name) {
  return name
    .normalize("NFD")                          // Split complex characters
    .replace(/[^\u0000-\u007F]/g, "")          // Remove non-ASCII (Tamil etc.)
    .replace(/[\s\W]+/g, "_")                  // Replace spaces/punctuation with _
    .replace(/_+/g, "_")                       // Collapse multiple underscores
    .replace(/^_+|_+$/g, "")                   // Trim leading/trailing _
    .toLowerCase();                            // Lowercase
}

async function loadLyricsForSelectedSong(optionElement) {
  const rawName = optionElement.value;
  console.log("🎵 Selected song name (raw):", rawName);

  const prefix = generatePrefixFromTamilName(rawName);
  console.log("📁 Generated prefix:", prefix);

  const filePath = `lyrics/${prefix}.txt`;
  console.log("📄 Final lyrics file path:", filePath);

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("Lyrics not found");
    const text = await response.text();
    document.getElementById("lyricsText").value = text;
    console.log("✅ Lyrics loaded successfully");
  } catch (err) {
    console.error("❌ Error loading lyrics:", err);
    document.getElementById("lyricsText").value = "Lyrics not found.";
  }
}
