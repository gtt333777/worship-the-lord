
console.log("songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("songLoader.js: Elements found, setting up handler");

  const songSelect = document.getElementById("songSelect");
  if (!songSelect) {
    console.error("songLoader.js: #songSelect not found");
    return;
  }

  songSelect.addEventListener("change", async () => {
    const selectedSong = songSelect.value;
    console.log("songLoader.js: Selected song:", selectedSong);
    if (!selectedSong) return;

    // Extract prefix from the selected option's value
    const option = [...songSelect.options].find(opt => opt.value === selectedSong);
    const prefix = option ? option.dataset.prefix : null;
    if (!prefix) {
      console.error("songLoader.js: Prefix not found for selected song");
      return;
    }

    console.log("songLoader.js: Using prefix:", prefix);

    try {
      console.log("songLoader.js: Requesting Dropbox access token...");
      const response = await fetch("/.netlify/functions/get-dropbox-token");
      if (!response.ok) throw new Error("Token fetch failed: " + response.status);
      const data = await response.json();
      const token = data.access_token;
      console.log("songLoader.js: Received Dropbox token");

      const vocalPath = `/WorshipSongs/${prefix}_vocal.mp3`;
      const accPath = `/WorshipSongs/${prefix}_acc.mp3`;
      console.log("songLoader.js: Preparing audio now...");
      prepareAudioFromDropbox(null, null); // fallback before real blobs (temporary log)

      const vocalBlob = await fetchDropboxFile(vocalPath, token);
      const accBlob = await fetchDropboxFile(accPath, token);

      if (!vocalBlob || !accBlob) {
        console.error("❌ Missing audio blobs");
        return;
      }

      console.log(`📦 vocalBlob size: ${vocalBlob.size}, accBlob size: ${accBlob.size}`);

      prepareAudioFromDropbox(vocalBlob, accBlob);
    } catch (err) {
      console.error("❌ songLoader.js: Audio function not ready, will retry shortly.", err);
    }
  });
});

async function fetchDropboxFile(path, token) {
  const url = "https://content.dropboxapi.com/2/files/download";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Dropbox-API-Arg": JSON.stringify({ path })
    }
  });

  if (!res.ok) {
    console.error("❌ Dropbox fetch failed:", path, res.status);
    return null;
  }

  return await res.blob();
}
