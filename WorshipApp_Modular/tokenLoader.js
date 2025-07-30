// WorshipApp_Modular/tokenLoader.js

let ACCESS_TOKEN = "";

async function loadDropboxToken() {
  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
    
  } catch (err) {
    console.error("❌ Failed to fetch Dropbox token:", err);
  }
}

// Call immediately on page load
loadDropboxToken();
