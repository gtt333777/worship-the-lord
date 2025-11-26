// 🕊️ shareThisApp.js
// --------------------------------------------------
// Enables native sharing of the Worship The Lord app
// with a friendly message and automatic fallback
// --------------------------------------------------

// 🕊️ shareThisApp.js
console.log("🕊️ shareThisApp.js loaded");

window.shareThisApp = async function () {
  const appUrl = "https://gtt333777.github.io/worship-the-lord/";
  const appTitle = "🎵 Worship The Lord";

  // ✔️ Link placed at bottom with blank line
  // ✔️ No emoji immediately before the link
  const appText =
    "🙌 ✝️ Worship The Lord App\n\n" +
    "1️⃣ Using this app., sing unto Jesus - Triune God, with studio-grade, perfectly synchronized background music.\n\n" +
    "2️⃣ Even in remote prayer gatherings, you can worship without internet using cached songs.\n\n" +
    "🕊️ Let everything that has breath praise the Lord! (Psalm 150:6)\n\n" +
    "\n" +         // <-- EXTRA BLANK LINE FOR CLICKABLE LINK
    appUrl;       // <-- WhatsApp now detects link correctly

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
  } else {
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

// ⭐ Ensure app volume is normal on load
window.addEventListener("load", () => {
  if (window.vocalAudio) {
    window.vocalAudio.volume = 0.8;
  }
  if (window.musicAudio) {
    window.musicAudio.volume = 0.8;
  }
});
