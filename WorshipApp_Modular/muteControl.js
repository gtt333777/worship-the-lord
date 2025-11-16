/* ============================================================
   muteControl.js — NON-JUGGLING MUTE SYSTEM (v3, persistence-ready)
   ============================================================ */

(function() {

  window._savedVocalVolume  = window._savedVocalVolume  ?? null;
  window._savedAccompVolume = window._savedAccompVolume ?? null;

  window._vocalIsMuted = window._vocalIsMuted ?? false;

  window.toggleMute = function(type) {

    const slider  = document.getElementById(type + "Volume");
    const display = document.getElementById(type + "VolumeDisplay");
    const btn     = document.getElementById(type + "MuteBtn");
    if (!slider) return;

    let savedSlot = (type === "vocal") ? "_savedVocalVolume"
                                       : "_savedAccompVolume";

    // --------------------------- UNMUTE ---------------------------
    if (window[savedSlot] !== null) {

      const restore = parseFloat(window[savedSlot]);

      if (type === "vocal") window._vocalIsMuted = false;

      slider.value = restore.toFixed(2);
      if (display) display.textContent = restore.toFixed(2);

      if (typeof setVolumeOnTargets === "function") {
        setVolumeOnTargets(type, restore);
      }

      window[savedSlot] = null;

      if (btn) {
        btn.textContent = "🔊 Mute";
        if (type === "vocal") btn.classList.remove("vocal-muted");
      }
      return;
    }

    // ---------------------------- MUTE ----------------------------
    const current = parseFloat(slider.value) || 0.0;

    if (!(type === "vocal" && window._vocalIsMuted)) {
      window[savedSlot] = current;

      // 🔒 persist mute saved value
      if (type === "vocal")  localStorage.setItem("vocalVolume",  current);
      if (type === "accomp") localStorage.setItem("accompVolume", current);
    }

    slider.value = "0.001";
    if (display) display.textContent = "0.001";

    if (typeof setVolumeOnTargets === "function") {
      setVolumeOnTargets(type, 0.001);
    }

    if (type === "vocal") window._vocalIsMuted = true;

    if (btn) {
      btn.textContent = "🔇 Unmute";
      if (type === "vocal") btn.classList.add("vocal-muted");
    }
  };

})();
