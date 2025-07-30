function getPrefixForTamilName(tamilName) {
  console.log("🔍 getPrefixForTamilName() called with:", tamilName);

  const map = {
    "உன்னததே உம பாதுகாப்பில்": "unnathathae_uma_paathugaappil",
    "இயேசு நந்தமும் நந்தமும் நந்தமும்": "yesu_nandhamum_nandhamum_nandhamum"
    // Add all other Tamil-to-prefix mappings here
  };

  const prefix = map[tamilName];
  if (!prefix) {
    console.warn("❌ Prefix not found for selected Tamil name:", tamilName);
  } else {
    console.log("✅ Found prefix:", prefix);
  }

  return prefix || "";
}

async function loadLyricsForSelectedSong(select) {
  const tamilName = select.value;
  console.log("🎵 Selected Tamil name from dropdown:", tamilName);

  const prefix = getPrefixForTamilName(tamilName);
  if (!prefix) {
    document.getElementById("lyricsArea").value = "Lyrics not found.";
    return;
  }

  const lyricsPath = `lyrics/${prefix}.txt`;
  console.log("📄 Attempting to load lyrics from:", lyricsPath);

  try {
    const res = await fetch(lyricsPath);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const text = await res.text();
    document.getElementById("lyricsArea").value = text;
    console.log("✅ Lyrics loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading lyrics:", err);
    document.getElementById("lyricsArea").value = "Lyrics not found.";
  }
}
