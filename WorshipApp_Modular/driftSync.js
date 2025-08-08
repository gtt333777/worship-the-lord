// WorshipApp_Modular/driftSync.js
// ✅ Global helper to instantly correct drift between vocal and accompaniment

function correctDriftNow() {
  if (!window.vocalAudio || !window.accompAudio) return;

  try {
    const drift = vocalAudio.currentTime - accompAudio.currentTime;
    if (Math.abs(drift) > 0.02) { // >20ms
      console.log(`⏱ Drift detected (${drift.toFixed(3)}s) → correcting...`);
      accompAudio.currentTime = vocalAudio.currentTime;
    }
  } catch (e) {
    console.warn("⚠️ Drift correction skipped:", e);
  }
}
