// === Dropbox Token Loader ===
let ACCESS_TOKEN = "";

async function loadDropboxToken() {
  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();

    if (!data.access_token) throw new Error("No access token returned");

    ACCESS_TOKEN = data.access_token;
    console.log("Dropbox token loaded successfully!");
  } catch (err) {
    console.error("Failed to fetch Dropbox token:", err);
  }
}

// Call on page load
document.addEventListener("DOMContentLoaded", loadDropboxToken);
