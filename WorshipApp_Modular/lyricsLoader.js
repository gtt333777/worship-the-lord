// === Lyrics Loader ===

function getPrefixForTamilName(tamilName) {
  const map = {
    "உன்னததே உம் பாதுகாப்பில்": "unnathathae_uma_paathugaappil",
    "கர்த்தரையே நோக்கி": "kartharaiae_nokki",
    "துன்பங்கள் வந்தாலும்": "thunbangal_vandhaalum",
    "நீரே எனது பற்று": "neerae_enathu_patru",
    "யேசுவே என் ஒக்கான்பாவே": "yesaenokkanbanavae",
    "சரியான அழகான நாள்": "sariyanaalaganaal"
  };

  return map[tamilName] || "";
}

async function loadLyricsForSelectedSong(optionElement) {
  const rawName = optionElement.value;
  console.log("🎵 Selected song name:", rawName);

  const prefix = getPrefixForTamilName(rawName);
  if (!prefix) {
    console.error("❌ Prefix not found for selected Tamil name");
    document.getElementById("lyricsText").value = "Lyrics not found.";
    return;
  }

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
