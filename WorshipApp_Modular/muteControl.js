/* ============================================================
   muteControl.js — FINAL NON-JUGGLING MUTE SYSTEM
   🔇 Uses slider-based mute (old-proven design)
   🔇 No memory, no wrappers, no interference with boost logic
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

    let savedSlot = (type === "vocal") ? "_savedVocalVolume" : "_savedAccompVolume";

    // -------- Unmute --------
    if (window[savedSlot] !== null) {

      const restore = window[savedSlot];

      slider.value = restore.toFixed(3);
      if (display) display.textContent = restore.toFixed(3);

      setVolumeOnTargets(type, restore);

      window[savedSlot] = null;

      if (btn) btn.textContent = "🔊 Mute";
      return;
    }

    // -------- Mute --------
    const current = parseFloat(slider.value);
    window[savedSlot] = current;  // save real value

    slider.value = "0.001";
    if (display) display.textContent = "0.001";

    setVolumeOnTargets(type, 0.001);

    if (btn) btn.textContent = "🔇 Unmute";
  };

})();
