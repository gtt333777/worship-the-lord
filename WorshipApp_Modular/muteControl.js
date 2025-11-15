/* ============================================================
   muteControl.js — FINAL NON-JUGGLING MUTE SYSTEM
   🔇 Uses slider-based mute (old-proven design)
   🔇 Safe with audioControl.js boost logic
   🔇 Prevents double-press problem
   🔇 Prevents overwriting saved volume when already muted
   ============================================================ */

(function(){

  // ------------------------------------------------------------
  //  Startup default mute alignment
  // ------------------------------------------------------------
  window._savedVocalVolume  = 0.002;   // your default vocal value
  window._savedAccompVolume = null;    // accomp starts unmuted
  window._vocalIsMuted      = true;    // audioControl.js checks this
  // ------------------------------------------------------------

  window.toggleMute = function(type) {

    const slider  = document.getElementById(type + "Volume");
    const display = document.getElementById(type + "VolumeDisplay");
    const btn     = document.getElementById(type + "MuteBtn");

    if (!slider) return;

    let savedSlot = (type === "vocal")
          ? "_savedVocalVolume"
          : "_savedAccompVolume";

    // ============================================================
    //                          UNMUTE
    // ============================================================
    if (window[savedSlot] !== null) {

      const restore = window[savedSlot];

      // Restore slider + display
      slider.value = restore.toFixed(3);
      if (display) display.textContent = restore.toFixed(3);

      // Restore actual audio volume
      setVolumeOnTargets(type, restore);

      // Clear saved memory
      window[savedSlot] = null;

      // Clear mute flag for vocal
      if (type === "vocal") window._vocalIsMuted = false;

      if (btn) btn.textContent = "🔊 Mute";
      return;
    }

    // ============================================================
    //                           MUTE
    // ============================================================

    const current = parseFloat(slider.value);

    // ⭐ IMPORTANT FIX ⭐
    // Do NOT overwrite saved volume again if already muted
    if (!(type === "vocal" && window._vocalIsMuted)) {
      window[savedSlot] = current;   // save real value ONLY first time
    }

    // Slider visually goes to muted level
    slider.value = "0.001";
    if (display) display.textContent = "0.001";

    // Real audio volume becomes silent
    setVolumeOnTargets(type, 0.001);

    // Mark vocal as muted
    if (type === "vocal") window._vocalIsMuted = true;

    if (btn) btn.textContent = "🔇 Unmute";
  };

})();
