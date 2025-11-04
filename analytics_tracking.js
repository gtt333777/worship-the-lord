// 📊 Worship The Lord - Analytics Tracker (final CORS-safe version)
// --------------------------------------------------

console.log("📊 analytics_tracking.js loaded");

// Unified dual endpoint + CORS-safe proxy
const ANALYTICS = {
  primary: "https://api.tinycounter.org",
  backup: "https://tinycounter.vercel.app",
  corsProxy: "https://api.allorigins.win/raw?url=",
  namespace: "worship-the-lord-app"
};

// -----------------------------------------------
// 1️⃣ Anonymous visit counter
// -----------------------------------------------
(function logAnonymousVisit() {
  const { primary, backup, corsProxy, namespace } = ANALYTICS;
  const key = "visits";

  // Helper for safe proxy-based hit
  async function safeHit(baseURL) {
    try {
      const targetURL = `${baseURL}/hit/${namespace}/${key}`;
      const proxyURL = corsProxy + targetURL;
      const res = await fetch(proxyURL);
      const text = await res.text();
      if (text.startsWith("{")) {
        const data = JSON.parse(text);
        console.log(`🙏 Total visits so far: ${data.value}`);
        return true;
      }
    } catch (err) {
      console.warn("⚠️ Visit logging failed:", err);
    }
    return false;
  }

  safeHit(primary).then(success => {
    if (!success) {
      console.log("🔁 Primary failed, trying backup...");
      safeHit(backup);
    }
  });
})();

// -----------------------------------------------
// 2️⃣ Generic event logger
// -----------------------------------------------
window.logAppEvent = function (action, label = "") {
  const { primary, backup, corsProxy, namespace } = ANALYTICS;
  const safeAction = encodeURIComponent(action.toLowerCase().replace(/\s+/g, "_"));

  async function safeHit(baseURL) {
    try {
      const targetURL = `${baseURL}/hit/${namespace}/${safeAction}`;
      const proxyURL = corsProxy + targetURL;
      const res = await fetch(proxyURL);
      const text = await res.text();
      if (text.startsWith("{")) {
        const data = JSON.parse(text);
        console.log(`✅ ${action} count: ${data.value}`);
        return true;
      }
    } catch (err) {
      console.warn(`⚠️ ${action} tracking failed:`, err);
    }
    return false;
  }

  safeHit(primary).then(success => {
    if (!success) safeHit(backup);
  });

  const timestamp = new Date().toISOString();
  console.log(`📈 Event: ${action}${label ? " - " + label : ""} @ ${timestamp}`);
};

// -----------------------------------------------
// 3️⃣ Auto-track major app actions
// -----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    if (e.target && e.target.matches("#shareButton, #shareAppDiv button, .share-btn"))
      logAppEvent("Share App");
  });

  document.addEventListener("click", (e) => {
    if (
      e.target &&
      (e.target.matches("#playBtn, .play-btn") ||
        e.target.innerText.includes("▶") ||
        e.target.innerText.toLowerCase().includes("play"))
    ) {
      const songName =
        e.target.getAttribute("data-song") || e.target.innerText.trim() || "Unknown Song";
      logAppEvent("Play Song", songName);
    }
  });

  window.addEventListener("appinstalled", () => logAppEvent("Install App"));
  window.addEventListener("offline", () => logAppEvent("Offline Mode Activated"));

  console.log("📊 Worship The Lord automatic analytics ready ✅");
});
