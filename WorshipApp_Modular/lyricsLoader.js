// WorshipApp_Modular/lyricsLoader.js

async function loadLyricsForSelectedSong(selectElement) {
  if (!selectElement) {
    console.error("❌ No select element provided.");
    return;
  }

  const tamilName = selectElement.value;
  if (!tamilName) {
    console.warn("⚠️ No song selected.");
    return;
  }

  const filename = `lyrics/${tamilName}.txt`;

  console.log(`🎵 Selected Tamil name: ${tamilName}`);
  console.log(`📄 Attempting to load lyrics from: ${filename}`);

  const lyricsBox = document.getElementById("lyricsArea");
  if (!lyricsBox) {
    console.error("❌ 'lyricsArea' textarea not found in HTML.");
    return;
  }

  try {
    const response = await fetch(filename);
    if (!response.ok) throw new Error(`Lyrics file not found: ${filename}`);

    const text = await response.text();
    lyricsBox.value = text;
    console.log("✅ Lyrics loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading lyrics:", err.message);
    lyricsBox.value = "Lyrics not found.";
  }
}
