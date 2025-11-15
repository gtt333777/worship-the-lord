/* ============================================================
   muteControl.js — FINAL CLEAN MUTE SYSTEM (Option A Compatible)
   🔇 Does NOT modify sliders or displays
   🔇 Does NOT override setVolumeOnTargets()
   🔇 Works perfectly with audioControl.js (mute-safe boost)
   ============================================================ */

(function () {

  // Store last real volume here (for mute/restore)
  window._muteMemory = window._muteMemory || {};

  // Debounce to avoid rapid toggles
  const DEBOUNCE_MS = 300;
  if (!window._lastMuteToggle) window._lastMuteToggle = 0;

  // ------------------------------------------------------------
  //   toggleMute(type)
  //   type = "vocal" or "accomp"
  // ------------------------------------------------------------
  window.toggleMute = function (type) {

    const now = Date.now();
    if (now - window._lastMuteToggle < DEBOUNCE_MS) {
      return; // ignore multiple fast clicks
    }
    window._lastMuteToggle = now;

    // Audio target
    const audio =
      (type === "vocal") ? window.vocalAudio :
      (type === "accomp") ? window.accompAudio :
      null;

    if (!audio) return;

    // Mute button element
    const btn = document.getElementById(type + "MuteBtn");

    // -------- UNMUTE (restore) --------
    if (typeof window._muteMemory[type] === "number") {

      let restore = window._muteMemory[type];

      // If the restore value was invalid (very rare), fall back to DEFAULTS
      if (!Number.isFinite(restore) || restore <= 0.001) {
        restore = (window.DEFAULTS && window.DEFAULTS[type]) || 0.002;
      }

      audio.volume = restore;
      window._muteMemory[type] = null; // mark unmuted

      if (btn) btn.textContent = "🔊 Mute";
      return;
    }

    // -------- MUTE --------
    let save = audio.volume;

    // If too small or invalid, fallback
    if (!Number.isFinite(save) || save <= 0.001) {
      save = (window.DEFAULTS && window.DEFAULTS[type]) || 0.002;
    }

    // Save restore value (muted flag)
    window._muteMemory[type] = save;

    // True silence
    audio.volume = 0;

    if (btn) btn.textContent = "🔇 Unmute";
  };

})();
