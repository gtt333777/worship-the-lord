// 📊 analytics_tracking.js
// --------------------------------------------------
// Worship The Lord App - Anonymous traffic + Event logger
// Tracks app visits, plays, shares, and installs
// 100% modular, non-invasive, privacy-safe
// --------------------------------------------------

console.log("📊 analytics_tracking.js loaded");

// -----------------------------------------------
// 1️⃣ Count anonymous visits (no cookies)
// -----------------------------------------------
(function logAnonymousVisit() {
  const namespace = "worship-the-lord-app";
  const key = "visits";
  fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`)
    .then((res) => res.json())
    .then((data) => console.log(`🙏 Total visits so far: ${data.value}`))
    .catch((err) => console.warn("⚠️ Visit logging failed:", err));
})();

// -----------------------------------------------
// 2️⃣ Generic event logger
// -----------------------------------------------
window.logAppEvent = function (action, label = "") {
  const timestamp = new Date().toISOString();
  console.log(`📈 Event: ${action}${label ? " - " + label : ""} @ ${timestamp}`);

  // Anonymous counter for each event type
  const safeAction = encodeURIComponent(action.toLowerCase().replace(/\s+/g, "_"));
  fetch(`https://api.countapi.xyz/hit/worship-the-lord-app/${safeAction}`)
    .then((res) => res.json())
    .then((data) => console.log(`✅ ${action} count: ${data.value}`))
    .catch((err) => console.warn("⚠️ Event count failed:", err));
};

// --------------------------------------------------
// 3️⃣ Auto-track key app activities
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 🕊️ Track share button clicks
  document.addEventListener("click", (e) => {
    if (e.target && e.target.matches("button.share, #shareButton, .share-btn")) {
      logAppEvent("Share App");
    }
  });

  // 🎵 Track song play
  // If your play buttons or elements have "play" or "▶" in them
  document.addEventListener("click", (e) => {
    if (
      e.target &&
      (e.target.matches(".play, #playButton, .play-btn") ||
       e.target.innerText.includes("▶") ||
       e.target.innerText.toLowerCase().includes("play"))
    ) {
      const songName =
        e.target.getAttribute("data-song") ||
        e.target.innerText.trim() ||
        "Unknown Song";
      logAppEvent("Play Song", songName);
    }
  });

  // 📱 Detect PWA installation event
  window.addEventListener("appinstalled", () => {
    logAppEvent("Install App");
  });

  // 💡 Optional: detect offline mode entry
  window.addEventListener("offline", () => {
    logAppEvent("Offline Mode Activated");
  });

  console.log("📊 Worship The Lord automatic analytics ready ✅");
});
