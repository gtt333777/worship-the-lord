function skipSeconds(seconds) {
  const current = Math.max(0, vocalAudio.currentTime + seconds);
  vocalAudio.currentTime = current;
  accompAudio.currentTime = current;
}
window.skipSeconds = skipSeconds; // Expose globally for button click
