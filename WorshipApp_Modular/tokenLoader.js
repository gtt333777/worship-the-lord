// WorshipApp_Modular/tokenLoader.js
// -----------------------------------------
// ✅ Pure static version (no Netlify)
// ✅ Works offline
// ✅ Ensures ACCESS_TOKEN always ready before any other script uses it
// -----------------------------------------

// 1️⃣ Dropbox access token (keep it safe — replace with yours)
window.ACCESS_TOKEN = "sl.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// 2️⃣ Optional: simple check + readiness helper
window.waitForAccessToken = async function (timeoutMs = 2000) {
  const start = Date.now();
  while (!window.ACCESS_TOKEN) {
    await new Promise(r => setTimeout(r, 50));
    if (Date.now() - start > timeoutMs) {
      console.warn("⚠️ ACCESS_TOKEN still empty after waiting");
      break;
    }
  }
  if (window.ACCESS_TOKEN)
    console.log("✅ ACCESS_TOKEN ready (local static mode)");
  else
    console.error("❌ ACCESS_TOKEN not set — please verify tokenLoader.js");
};

// 3️⃣ Call it immediately so other scripts can safely await it
window.waitForAccessToken();
