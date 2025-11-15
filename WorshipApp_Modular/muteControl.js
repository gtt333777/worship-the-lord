/* ============================================================
   muteControl.js — FINAL NON-JUGGLING MUTE SYSTEM
   🔇 Uses slider-based mute (old-proven design)
   🔇 Mute flag added for boost suppression
   🔇 No interference with boost/glow logic otherwise
   🔇 Fully stable on mobile
   ============================================================ */

(function(){

  // store last slider value temporarily
  window._savedVocalVolume = null;
  window._savedAccompVolume = null;

  window.toggleMute = function(type) {

    const slider = document.getElementById(type + "Volume");
    const display = document.getElementById(type + "VolumeDisplay");
    const btn = document.getElementById(type + "MuteBtn");

    if (!slider) return;

    // which memory slot to use
    let savedSlot = (type === "vocal") ? "_savedVocalVolume" : "_savedAccompVolume";

    // ============================================================
    //                 UNMUTE
    // ============================================================
    if (window[savedSlot] !== null) {

      const restore = window[savedSlot];

      // Restore slider & display
      slider.value = restore.toFixed(3);
      if (display) display.textContent = restore.toFixed(3);

      // Restore actual audio volume
      setVolumeOnTargets(type, restore);

      // Clear saved memory
      window[savedSlot] = null;

      // Clear mute flag ONLY for vocal
      if (type === "vocal") window._vocalIsMuted = false;

      if (btn) btn.textContent = "🔊 Mute";
      return;
    }

    // ============================================================
    //                 MUTE
    // ============================================================
    const current = parseFloat(slider.value);
    window[savedSlot] = current;  // save real value

    // Force slider visually to muted level
    slider.value = "0.001";
    if (display) display.textContent = "0.001";

    // Force actual audio volume to silent
    setVolumeOnTargets(type, 0.001);

    // Set mute flag ONLY for vocal
    if (type === "vocal") window._vocalIsMuted = true;

    if (btn) btn.textContent = "🔇 Unmute";
  };

})();
