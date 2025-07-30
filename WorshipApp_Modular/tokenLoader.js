// WorshipApp_Modular/tokenLoader.js

let ACCESS_TOKEN = "";

// 🔄 Load new short-lived access token from Netlify Function
async function loadDropboxToken() {
  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
  } catch (err) {
    console.error("❌ Failed to fetch Dropbox token:", err);
  }
}

// 📂 Build Dropbox temporary streaming URL for a given filename
async function getDropboxFileURL(filename) {
  if (!ACCESS_TOKEN) {
    await loadDropboxToken();
  }

  const dropboxPath = `/WorshipSongs/${filename}`;

  try {
    const response = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: dropboxPath }),
    });

    if (!response.ok) {
      throw new Error(`Dropbox error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.link; // ✅ Streaming link (temporary)
  } catch (err) {
    console.error("❌ Failed to get Dropbox file URL:", err);
    return null;
  }
}
