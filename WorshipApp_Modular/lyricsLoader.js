// WorshipApp_Modular/lyricsLoader.js

function getPrefixForTamilName(tamilName) {
  const map = {
    "உன்னததே உம பாதுகாப்பில்": "unnathathae_uma_paathugaappil",
    "கர்த்தரையே நோக்கி": "kartharaiae_nokki",
    "துன்பங்கள் வந்தாலும்": "thunbangal_vandhaalum",
    "நீரே எனது பற்று": "neerae_enathu_patru",
    "யேசுவே என் ஒக்கான்பாவே": "yesaenokkanbanavae",
    "சரியான அழகான நாள்": "sariyanaalaganaal",
    "என்னை காண்பவரே": "ennai_kaanbavarae"
  };

  const clean = tamilName.trim().replace(/\s+/g, " ");
  for (const [key, prefix] of Object.entries(map)) {
    if (clean.includes(key)) {
      return prefix;
    }
  }

  console.warn("Prefix not found for song name:", tamilName);
  return "";
}

async function loadLyricsForSelectedSong(songName) {
  console.log("🎵 Selected song name (raw):", songName);

  const prefix = getPrefixForTamilName(songName);
  console.log("📁 Generated prefix:", prefix);

  if (!prefix) {
    console.error("🚫 No prefix found for song name. Lyrics cannot be loaded.");
    return;
  }

  const filePath = `lyrics/${prefix}.txt`;
  console.log("📄 Final lyrics file path:", filePath);

  try {
    const res = await fetch(filePath);
    if (!res.ok) {
      throw new Error("Lyrics file not found: " + filePath);
    }

    const lyrics = await res.text();
    const textarea = document.getElementById("lyricsArea");

    if (textarea) {
      textarea.value = lyrics;
      console.log("✅ Lyrics loaded successfully.");
    } else {
      console.error("🚫 Lyrics area textarea not found in DOM.");
    }
  } catch (err) {
    console.error("❌ Error loading lyrics:", err.message);
  }
}

export { loadLyricsForSelectedSong };
