// WorshipApp_Modular/songLoader.js

// ✅ Use the existing global audio elements from audioControl.js
// (Do NOT create new Audio objects here)

// === Play/Pause ===
document.getElementById("playBtn").addEventListener("click", () => {
  console.log("▶️ Play button clicked");

  if (!ACCESS_TOKEN) {
    console.error("❌ ACCESS_TOKEN not yet loaded.");
    return;
  }

  const songName = document.getElementById("songSelect").value;
  if (!songName) {
    console.warn("⚠️ No song selected.");
    return;
  }

  const vocalUrl = getDropboxFileURL(songName + "_vocal.mp3");
  const accUrl = getDropboxFileURL(songName + "_acc.mp3");

  console.log("🎧 Streaming vocal from:", vocalUrl);
  console.log("🎧 Streaming accompaniment from:", accUrl);

  // ✅ Use the existing global objects here
  vocalAudio.src = vocalUrl;
  accompAudio.src = accUrl;

  // Sync playback
  Promise.all([
    vocalAudio.play().catch(err => console.error("❌ Vocal play error:", err)),
    accompAudio.play().catch(err => console.error("❌ Accompaniment play error:", err))
  ]).then(() => {
    console.log("✅ Both audio tracks started.");
  });
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  console.log("⏸️ Pause button clicked");
  vocalAudio.pause();
  accompAudio.pause();
});

// === Dropbox URL Builder ===
function getDropboxFileURL(filename) {
  const dropboxPath = "/WorshipSongs/" + filename;
  return `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${ACCESS_TOKEN}&arg={"path":"${dropboxPath}"}`;
}
