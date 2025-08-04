console.log("tokenLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("tokenLoader.js: DOMContentLoaded fired");

  try {
    const res = await fetch("/.netlify/functions/get-dropbox-token");
    if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
    
    const data = await res.json();
    window.accessToken = data.access_token;

    console.log("🔑 accessToken received and stored");

    // Now that token is ready, call song loader logic if needed
    if (window.prepareSongAfterToken) {
      console.log("⏩ Running deferred song load after token...");
      window.prepareSongAfterToken();
    }
  } catch (err) {
    console.error("❌ Error fetching token:", err);
  }
});
