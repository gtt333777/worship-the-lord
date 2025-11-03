// 🕊️ shareThisApp.js
// --------------------------------------------------
// Enables native sharing of the Worship The Lord app
// with a friendly message and automatic fallback
// --------------------------------------------------

/*
console.log("🕊️ shareThisApp.js loaded");

window.shareThisApp = async function() {
  const appUrl = "https://gtt333777.github.io/worship-the-lord/";
  const appTitle = "🎵 Worship The Lord";
  const appText =
    "🙌 ✝️ Worship The Lord App
1️⃣ With this app., Sing unto Jesus - Triune God, with studio-grade, perfectly synchronized background music. You can gently lower the vocal track and lift your own voice in true harmony.
2️⃣ Even in remote prayer gatherings, you can worship without internet. Using a small Bluetooth speaker (like JBL), the cached songs play beautifully — so every heart can join together in praise.
🕊️ Let everything that has breath praise the Lord! (Psalm 150:6)
: " + appUrl;

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

*/

// 🕊️ shareThisApp.js
console.log("🕊️ shareThisApp.js loaded");

window.shareThisApp = async function() {
  const appUrl = "https://gtt333777.github.io/worship-the-lord/";
  const appTitle = "🎵 Worship The Lord";
  const appText =
    "🙌 ✝️ Worship The Lord App\n\n" +
    "1️⃣ Using this app., sing unto Jesus - Triune God, with studio-grade, perfectly synchronized background music. " +
    "You can gently lower the vocal track and lift your own voice in true harmony.\n\n" +
    "2️⃣ Using this app., even in remote prayer gatherings, you can worship without internet. " +
    "Using a small Bluetooth speaker (like JBL), the cached songs and music play seamlessly — so every heart can join in praise.\n\n" +
    "🕊️ Let everything that has breath praise the Lord! (Psalm 150:6)\n\n" +
    appUrl;

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
