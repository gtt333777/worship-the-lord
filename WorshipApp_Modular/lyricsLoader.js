// lyricsLoader.js

async function loadLyricsForSelectedSong(selectElement) {
  const tamilName = selectElement.value;
  const filename = `lyrics/${tamilName}.txt`;

  console.log(`🎵 Selected Tamil name: ${tamilName}`);
  console.log(`📄 Attempting to load lyrics from: ${filename}`);

  try {
    const response = await fetch(filename);
    if (!response.ok) throw new Error("Lyrics file not found");

    const text = await response.text();
    document.getElementById("lyricsArea").value = text;
    console.log("✅ Lyrics loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading lyrics:", err.message);
    document.getElementById("lyricsArea").value = "Lyrics not found.";
  }
}
