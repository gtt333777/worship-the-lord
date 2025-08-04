console.log("songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("songLoader.js: Elements found, setting up handler");

  const songSelect = document.getElementById("songSelect");
  if (!songSelect) return;

  songSelect.addEventListener("change", async () => {
    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    const token = await getDropboxAccessToken();
    if (!token) {
      console.error("❌ Dropbox token not available");
      return;
    }

    const prefix = getPrefixForSong(selectedSong);
    console.log("songLoader.js: Preparing audio now...");

    const vocalPath = `/WorshipSongs/${prefix}_vocal.mp3`;
    const accPath = `/WorshipSongs/${prefix}_acc.mp3`;

    const vocalBlob = await fetchDropboxFile(vocalPath, token);
    const accBlob = await fetchDropboxFile(accPath, token);

    if (!vocalBlob || !accBlob) {
      console.error("❌ Missing audio blobs");
      return;
    }

    prepareAudioFromDropbox(vocalBlob, accBlob);
  });
});

async function fetchDropboxFile(path, token) {
  const url = `https://content.dropboxapi.com/2/files/download`;
  console.log(`📦 Fetching from Dropbox path: ${path}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify({ path })
      }
    });

    if (!response.ok) {
      throw new Error(`Dropbox fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    console.log(`✅ Dropbox fetch success: ${path}, size: ${blob.size}`);
    return blob;
  } catch (err) {
    console.error(`❌ Dropbox fetch error for ${path}:`, err);
    return null;
  }
}

function getPrefixForSong(selectedName) {
  const allTextFiles = window.songNameToPrefixMap || [];
  const matched = allTextFiles.find(entry => selectedName.includes(entry.name));
  return matched ? matched.prefix : selectedName; // fallback: use name
}

async function getDropboxAccessToken() {
  console.log("songLoader.js: Requesting Dropbox access token...");
  try {
    const response = await fetch("/.netlify/functions/get-dropbox-token");
    if (!response.ok) throw new Error("Token fetch failed");

    const data = await response.json();
    console.log("songLoader.js: Received Dropbox token");
    return data.access_token;
  } catch (err) {
    console.error("❌ Failed to get Dropbox token:", err);
    return null;
  }
}
