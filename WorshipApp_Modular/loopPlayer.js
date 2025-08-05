// loopPlayer.js
console.log("loopPlayer.js: Starting...");

document.addEventListener('DOMContentLoaded', () => {
  console.log("loopPlayer.js: DOMContentLoaded – checking for global readiness...");

  const checkGlobalsReady = () => {
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;
    const currentSongName = window.currentSongName;

    if (!vocalAudio || !accompAudio || !currentSongName) {
      console.warn("loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName... (attempt " + (checkGlobalsReady.attempts + 1) + ")");
      checkGlobalsReady.attempts++;
      if (checkGlobalsReady.attempts < 10) {
        setTimeout(checkGlobalsReady, 300); // Retry
      } else {
        console.error("loopPlayer.js: Failed to find required global variables.");
      }
      return;
    }

    console.log("loopPlayer.js: All globals ready! ✅");

    // Setup your logic here – e.g., using vocalAudio, accompAudio, currentSongName
    // For now, let's just log:
    console.log("🎤 vocalAudio:", vocalAudio);
    console.log("🎹 accompAudio:", accompAudio);
    console.log("🎵 currentSongName:", currentSongName);

    // You can now write your playback logic here
  };

  checkGlobalsReady.attempts = 0;
  checkGlobalsReady();
});
