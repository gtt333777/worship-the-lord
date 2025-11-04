// 🕊️ analytics_tracking.js — Private local analytics
// Tracks visits, songs played, shares, and installs privately in this browser.

console.log("🕊️ analytics_tracking.js loaded");

(function() {
  // Load previous stats or initialize
  const analytics = JSON.parse(localStorage.getItem("worship_analytics") || "{}");

  // Ensure default counters
  analytics.visits = (analytics.visits || 0) + 1;
  analytics.songsPlayed = analytics.songsPlayed || 0;
  analytics.appShares = analytics.appShares || 0;
  analytics.installs = analytics.installs || 0;
  analytics.offlineMode = analytics.offlineMode || 0;

  // Save updated data
  localStorage.setItem("worship_analytics", JSON.stringify(analytics));

  console.log("📊 Local analytics updated:", analytics);

  // Make it globally usable (optional)
  window.privateAnalytics = {
    increment: function(key) {
      const data = JSON.parse(localStorage.getItem("worship_analytics") || "{}");
      data[key] = (data[key] || 0) + 1;
      localStorage.setItem("worship_analytics", JSON.stringify(data));
    },
    get: function() {
      return JSON.parse(localStorage.getItem("worship_analytics") || "{}");
    }
  };
})();
