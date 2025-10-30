// WorshipApp_Modular/tokenLoader.js

let ACCESS_TOKEN = localStorage.getItem("ACCESS_TOKEN") || "";
let tokenLoaded = false;

/** 🧠 Load Dropbox token once, cache for future */
async function loadDropboxToken() {
  if (ACCESS_TOKEN) {
    console.log("✅ Dropbox token loaded from localStorage");
    tokenLoaded = true;
    return;
  }

  try {
    console.log("🌐 Fetching Dropbox token from Netlify...");
    const res = await fetch("/.netlify/functions/getDropboxToken");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
    localStorage.setItem("ACCESS_TOKEN", ACCESS_TOKEN);
    tokenLoaded = true;
    console.log("✅ Dropbox token fetched and cached locally");
  } catch (err) {
    console.error("❌ Failed to load Dropbox token:", err);
  }
}

/** 🕒 Wait until ACCESS_TOKEN is ready before using */
async function waitForAccessToken() {
  let retries = 50; // ~5 seconds max
  while (!ACCESS_TOKEN && retries-- > 0) {
    await new Promise(r => setTimeout(r, 100));
  }
  if (!ACCESS_TOKEN) console.warn("⚠️ ACCESS_TOKEN still empty after waiting");
}

// Load token immediately when script loads
loadDropboxToken();
