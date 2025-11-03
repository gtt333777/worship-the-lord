// 🕊️ shareThisApp.js
// --------------------------------------------------
// Enables native sharing of the Worship The Lord app
// with a friendly message and automatic fallback
// --------------------------------------------------

console.log("🕊️ shareThisApp.js loaded");

window.shareThisApp = async function() {
  const appUrl = "https://gtt333777.github.io/worship-the-lord/";
  const appTitle = "🎵 Worship The Lord";
  const appText =
    "🙌 I enjoy using the Worship The Lord app — a bilingual worship songs app with offline playback and segment loops. Try it here: " + appUrl;

  // ✅ Native Share API (works on Android, iOS, etc.)
  if (navigator.share) {
    try {
      await navigator.share({
        title: appTitle,
        text: appText,
        url: appUrl
      });
      console.log("✅ Shared successfully via native share menu.");
    } catch (err) {
      console.warn("⚠️ Share cancelled or failed:", err);
    }
  }
  // ❌ Fallback: copy link to clipboard
  else {
    try {
      await navigator.clipboard.writeText(appText);
      alert("📋 Link copied!\nYou can now paste it into WhatsApp, Messages, or Email.");
      console.log("✅ Copied to clipboard:", appText);
    } catch (err) {
      console.error("❌ Clipboard copy failed:", err);
      alert("Sorry, your browser doesn't support sharing.");
    }
  }
};
