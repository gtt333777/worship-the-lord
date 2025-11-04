// 📊 analytics_tracking.js
// --------------------------------------------------
// Worship The Lord App - Anonymous traffic + Event logger
// Uses CountAPI mirror (https://countapi.jcmd.tk) for global reliability
// --------------------------------------------------

console.log("📊 analytics_tracking.js loaded");

// ✅ Base endpoint (mirror)
const COUNT_API = "https://countapi.jcmd.tk";

// -----------------------------------------------
// 1️⃣ Count anonymous visits (no cookies)
// -----------------------------------------------
(function logAnonymousVisit() {
  const namespace = "worship-the-lord-app";
  const key = "visits";

  fetch(`${COUNT_API}/hit/${namespace}/${key}`)
    .then(async (res) => {
      const text = await res.text();
      if (text.startsWith("{")) {
        const data = JSON.parse(text);
        console.log(`🙏 Total visits so far: ${data.value}`);
      } else {
        console.log("⚠️ Visit logging skipped (non-JSON response)");
      }
    })
    .catch(() => console.log("⚠️ Visit logging failed (network issue)"));
})();

// -----------------------------------------------
// 2️⃣ Generic event logger
// -----------------------------------------------
window.logAppEvent = function (action, label = "") {
  const timestamp = new Date().toISOString();
  console.log(`📈 Event: ${action}${label ? " - " + label : ""} @ ${timestamp}`);

  const safeAction = encodeURIComponent(action.toLowerCase().replace(/\s+/g, "_"));
  fetch(`${COUNT_API}/hit/worship-the-lord-app/${safeAction}`)
    .then(async (res) => {
      const text = await res.text();
      if (text.startsWith("{")) {
        const data = JSON.parse(text);
        console.log(`✅ ${action} count: ${data.value}`);
      } else {
        console.log(`⚠️ ${action} logging skipped (non-JSON response)`);
      }
    })
    .catch(() => console.log(`⚠️ ${action} logging failed (network issue)`));
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

  // 💡 Detect offline mode entry
  window.addEventListener("offline", () => {
    logAppEvent("Offline Mode Activated");
  });

  console.log("📊 Worship The Lord automatic analytics ready ✅");
});
