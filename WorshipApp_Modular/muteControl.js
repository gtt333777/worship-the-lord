/* ============================================================
   muteControl.js — Clean standalone mute/unmute system
   🔇 Does NOT modify sliders or displays
   🔇 Does NOT override setVolumeOnTargets()
   🔇 100% non-juggling — only touches real audio volumes
   ============================================================ */

(function(){
  // global restore memory
  window._muteMemory = window._muteMemory || {};

  // simple debounce guard
  const DEBOUNCE_MS = 300;
  if (!window._lastMuteToggle) window._lastMuteToggle = 0;

  // ------------------------------------------------------------
  //  toggleMute(type)
  //  type = "vocal" or "accomp"
  // ------------------------------------------------------------
  window.toggleMute = function(type) {

    const now = Date.now();
    if (now - window._lastMuteToggle < DEBOUNCE_MS) return;
    window._lastMuteToggle = now;

    const audio =
      (type === "vocal") ? window.vocalAudio :
      (type === "accomp") ? window.accompAudio :
      null;

    const btn = document.getElementById(type + "MuteBtn");

    if (!audio) return;

    // If already muted -> unmute
    if (typeof window._muteMemory[type] === "number") {
      const restore = window._muteMemory[type];
      audio.volume = restore;
      window._muteMemory[type] = null;
      if (btn) btn.textContent = "🔊 Mute";
      return;
    }

    // Not muted -> mute and store current audio.volume
    let save = audio.volume;
    if (!Number.isFinite(save) || save <= 0.001) {
      save = (window.DEFAULTS[type] || 0.002);
    }

    window._muteMemory[type] = save;

    // Real silence (VERY important)
    audio.volume = 0;

    if (btn) btn.textContent = "🔇 Unmute";
  };

})();
