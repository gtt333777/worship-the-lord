// 🕊️ shareThisApp.js
// --------------------------------------------------
// Enables sharing of the Worship The Lord app
// + SMART SONG SHARE (SEO Growth Engine)
// --------------------------------------------------

console.log("🕊️ shareThisApp.js loaded");


/* ======================================================
   🕊️ SHARE ENTIRE APP
====================================================== */
window.shareThisApp = async function () {

    const appUrl = "https://gtt333777.github.io/worship-the-lord/";
    const appTitle = "🎵 Worship The Lord";

    const appText =
        "🙌 ✝️ Worship The Lord App\n\n" +
        "1️⃣ Using this app, sing unto Jesus — Triune God — with studio-grade synchronized background music.\n\n" +
        "2️⃣ Even in remote prayer gatherings, worship without internet using cached songs.\n\n" +
        "🕊️ Let everything that has breath praise the Lord! (Psalm 150:6)\n\n" +
        appUrl;

    if (navigator.share) {
        try {
            await navigator.share({
                title: appTitle,
                text: appText,
                url: appUrl
            });
            console.log("✅ App shared successfully.");
        } catch (err) {
            console.warn("⚠️ Share cancelled:", err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(appText);
            alert("📋 Link copied!\nYou can now paste and share.");
        } catch (err) {
            alert("Sharing not supported on this browser.");
        }
    }
};



/* ======================================================
   🎵 SMART SONG SHARE (SEO + Growth Boost)
====================================================== */
window.shareThisSong = async function () {

    const select = document.getElementById("songSelect");

    if (!select || !select.value) {
        alert("Please select a song first.");
        return;
    }

    const songName = select.value.trim();

    const baseURL =
        "https://gtt333777.github.io/worship-the-lord/";

    const shareURL =
        baseURL + "?song=" + encodeURIComponent(songName);



    // ⭐ SEO-optimized share message
    const shareText =
        `🙏 Worship Together

🎵 ${songName}

Sing and worship Jesus using this Tamil Christian karaoke song in the Worship The Lord app.

Perfect for personal prayer, family worship, and church fellowship.

Open directly here:
${shareURL}`;









    const shareData = {
        title: songName + " Karaoke | Worship The Lord",
        text: shareText,
        url: shareURL
    };

    // ✅ Mobile native share
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            console.log("✅ Song shared:", songName);
        } catch (err) {
            console.warn("⚠️ Share cancelled:", err);
        }
    }
    // ✅ Desktop fallback (copy link)
    else {
        try {
            await navigator.clipboard.writeText(shareText);
            alert("📋 Song link copied!\nPaste and share anywhere.");
        } catch (err) {
            alert("Sharing not supported on this browser.");
        }
    }
};