// 📊 analytics_tracking.js
// --------------------------------------------------
// Worship The Lord App - Anonymous traffic + Event logger
// Smart version with fallback and reachability check
// --------------------------------------------------

console.log("📊 analytics_tracking.js loaded");

const PRIMARY_API = "https://api.tinycounter.org";
const BACKUP_API = "https://tinycounter.vercel.app"; // ✅ works in India

async function safeFetchJSON(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (text.startsWith("{")) {
      return JSON.parse(text);
    } else {
      console.log("⚠️ Non-JSON response → will try backup");
      return null;
    }
  } catch {
    return null;
  }
}

async function fetchWithFallback(url1, url2) {
  const data = await safeFetchJSON(url1);
  if (data) return data;
  return await safeFetchJSON(url2);
}

// --------------------------------------------------
// 1️⃣ Count anonymous visits
// --------------------------------------------------
(async function logAnonymousVisit() {
  const namespace = "worship-the-lord-app";
  const key = "visits";
  const data = await fetchWithFallback(
    `${PRIMARY_API}/hit/${namespace}/${key}`,
    `${BACKUP_API}/hit/${namespace}/${key}`
  );
  if (data && data.value !== undefined) {
    console.log(`🙏 Total visits so far: ${data.value}`);
  } else {
    console.log("⚠️ Visit logging skipped (no valid response)");
  }
})();

// --------------------------------------------------
// 2️⃣ Generic event logger
// --------------------------------------------------
window.logAppEvent = async function (action, label = "") {
  const timestamp = new Date().toISOString();
  console.log(`📈 Event: ${action}${label ? " - " + label : ""} @ ${timestamp}`);

  const safeAction = encodeURIComponent(action.toLowerCase().replace(/\s+/g, "_"));
  const data = await fetchWithFallback(
    `${PRIMARY_API}/hit/worship-the-lord-app/${safeAction}`,
    `${BACKUP_API}/hit/worship-the-lord-app/${safeAction}`
  );

  if (data && data.value !== undefined) {
    console.log(`✅ ${action} count: ${data.value}`);
  } else {
    console.log(`⚠️ ${action} logging skipped (no valid response)`);
  }
};

// --------------------------------------------------
// 3️⃣ Auto-track key activities
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 🕊️ Share
  document.addEventListener("click", (e) => {
    if (e.target && e.target.matches("button.share, #shareButton, .share-btn")) {
      logAppEvent("Share App");
    }
  });

  // 🎵 Play
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

  // 📱 PWA install
  window.addEventListener("appinstalled", () => logAppEvent("Install App"));
  // 🌐 Offline
  window.addEventListener("offline", () => logAppEvent("Offline Mode Activated"));

  console.log("📊 Worship The Lord automatic analytics ready ✅");

  // 🌍 Reachability test
  fetch(PRIMARY_API, { method: "HEAD" })
    .then(() => console.log("🌐 Analytics server reachable ✅"))
    .catch(() => console.warn("🚫 Analytics server unreachable — using fallback"));
});
