// === songLoader.js ===

// 1. Convert Tamil name to Dropbox file prefix
function getSlugFromTamil(tamilName) {
  const slugMap = {
    "இயேசு நந்தமே நந்தமே நந்தமே": "yesu_nanthame",
    "வேலை செய்யும் தேவன்": "velai_seyyum",
    "ஆசீர்வாதம் தரும்": "aaseervadham_dharum",
    // ✅ Add more mappings here based on your songs_names.txt
  };

  return slugMap[tamilName.trim()];
}

// 2. Build Dropbox download URL
function buildDropboxURL() {
  return "https://content.dropboxapi.com/2/files/download";
}

// 3. Stream and set audio sources
async function streamSelectedSong(tamilName) {
  const slug = getSlugFromTamil(tamilName);
  if (!slug) {
    alert("Prefix not found for selected song!");
    return;
  }

  const vocalPath = `/WorshipSongs/${slug}_vocal.wav.mp3`;
  const accPath = `/WorshipSongs/${slug}_acc.wav.mp3`;

  try {
    // === Fetch vocal file
    const headers = {
      Authorization: "Bearer " + ACCESS_TOKEN,
      "Dropbox-API-Arg": JSON.stringify({ path: vocalPath }),
    };

    const vocalRes = await fetch(buildDropboxURL(), {
      method: "POST",
      headers,
    });

    if (!vocalRes.ok) throw new Error("Vocal fetch failed");

    const vocalBlob = await vocalRes.blob();

    // === Fetch accompaniment file
    headers["Dropbox-API-Arg"] = JSON.stringify({ path: accPath });

    const accRes = await fetch(buildDropboxURL(), {
      method: "POST",
      headers,
    });

    if (!accRes.ok) throw new Error("Accompaniment fetch failed");

    const accBlob = await accRes.blob();

    // === Assign to audio elements
    vocalAudio.src = URL.createObjectURL(vocalBlob);
    accompAudio.src = URL.createObjectURL(accBlob);

    console.log("Audio files loaded successfully.");
  } catch (error) {
    console.error("Failed to stream audio:", error);
    alert("Audio loading error! Please check the file prefix or token.");
  }
}
