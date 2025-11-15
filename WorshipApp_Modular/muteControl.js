/* ============================================================
   muteControl.js — FINAL NON-JUGGLING MUTE SYSTEM
   🔇 Uses slider-based mute (old-proven design)
   🔇 Mute flag added (for audioControl.js boost suppression)
   🔇 Fully stable on mobile
   ============================================================ */

(function() {

  // ------------------------------------------------------------
  //  Startup default mute alignment
  // ------------------------------------------------------------
  window._savedVocalVolume  = null;    // vocal starts unmuted (important!)
  window._savedAccompVolume = null;    // accomp starts unmuted
  window._vocalIsMuted      = false;    // audioControl.js checks this
  // ------------------------------------------------------------

  window.toggleMute = function(type) {

    const slider  = document.getElementById(type + "Volume");
    const display = document.getElementById(type + "VolumeDisplay");
    const btn     = document.getElementById(type + "MuteBtn");

    if (!slider) return;

    let savedSlot = (type === "vocal") ? "_savedVocalVolume"
                                       : "_savedAccompVolume";

    // ============================================================
    //                        UNMUTE
    // ============================================================
    if (window[savedSlot] !== null) {

      const restore = window[savedSlot];

      // Restore slider visually
      slider.value = restore.toFixed(3);
      if (display) display.textContent = restore.toFixed(3);

      // *** FIXED ORDER ***
      // 1) Clear mute flag FIRST
      if (type === "vocal") window._vocalIsMuted = false;

      // 2) Now restore real audio volume
      setVolumeOnTargets(type, restore);

      // Clear saved memory
      window[savedSlot] = null;

      //if (btn) btn.textContent = "🔊 Mute";
      if (btn) {
   btn.textContent = "🔊 Mute";
   btn.classList.remove("vocal-muted");
}

      return;
    }

    // ============================================================
    //                        MUTE
    // ============================================================
    const current = parseFloat(slider.value);

    // Do NOT overwrite saved value if already muted
    if (!(type === "vocal" && window._vocalIsMuted)) {
      window[savedSlot] = current;
    }

    // Force slider visually to muted level
    slider.value = "0.001";
    if (display) display.textContent = "0.001";

    // Force real audio silent
    setVolumeOnTargets(type, 0.001);

    // Set mute flag
    if (type === "vocal") window._vocalIsMuted = true;

    //if (btn) btn.textContent = "🔇 Unmute";


    if (btn) {
   btn.textContent = "🔇 Unmute";
   if (type === "vocal") btn.classList.add("vocal-muted");
}



  };

})();
