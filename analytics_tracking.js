console.log("📊 analytics_tracking.js loaded");

// Simple global analytics using CountAPI (no token, no backend)

// ---- App Opens ----
fetch("https://api.countapi.xyz/hit/worship-the-lord/app_open")
  .then(res => res.json())
  .then(data => {
    document.getElementById("appOpens").textContent = data.value;
    console.log("App Opens:", data.value);
  })
  .catch(err => console.error("⚠️ App Opens fetch failed:", err));

// ---- Songs Played ----
fetch("https://api.countapi.xyz/hit/worship-the-lord/songs_played")
  .then(res => res.json())
  .then(data => {
    document.getElementById("songsPlayed").textContent = data.value;
    console.log("Songs Played:", data.value);
  })
  .catch(err => console.error("⚠️ Songs Played fetch failed:", err));

// ---- App Shares ----
fetch("https://api.countapi.xyz/hit/worship-the-lord/app_shares")
  .then(res => res.json())
  .then(data => {
    document.getElementById("appShares").textContent = data.value;
    console.log("App Shares:", data.value);
  })
  .catch(err => console.error("⚠️ App Shares fetch failed:", err));

// ---- App Installs ----
fetch("https://api.countapi.xyz/hit/worship-the-lord/app_installs")
  .then(res => res.json())
  .then(data => {
    document.getElementById("appInstalls").textContent = data.value;
    console.log("App Installs:", data.value);
  })
  .catch(err => console.error("⚠️ App Installs fetch failed:", err));

// ---- Offline Mode Entries ----
fetch("https://api.countapi.xyz/hit/worship-the-lord/offline_mode_entries")
  .then(res => res.json())
  .then(data => {
    document.getElementById("offlineModeEntries").textContent = data.value;
    console.log("Offline Mode Entries:", data.value);
  })
  .catch(err => console.error("⚠️ Offline Mode fetch failed:", err));

console.log("✅ Worship The Lord global analytics (CountAPI) ready");
