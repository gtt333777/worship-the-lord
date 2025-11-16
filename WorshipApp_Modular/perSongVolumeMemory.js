/* ============================================================
   perSongVolumeMemory.js
   - Per-song persistent volume storage (vocal + accomp)
   - Minimal, global-only API; does NOT assume audio elements.
   - Uses encodeURIComponent(songName) to make safe storage keys.
   ============================================================ */

(function(){

  // Public API (global)
  // Use window.perSongVolumeMemory.* to call if desired.
  window.perSongVolumeMemory = window.perSongVolumeMemory || {};

  // Build a safe localStorage key for a given type and songName
  function _key(type, songName){
    // type: "vocal" or "accomp"
    // songName: the exact value from your <option value="...">
    var safe = typeof songName === "string" ? songName : String(songName || "");
    return type + "Volume_" + encodeURIComponent(safe);
  }

  // Load a single value (returns number or null)
  function loadValue(type, songName){
    try {
      var k = _key(type, songName);
      var raw = localStorage.getItem(k);
      if (raw === null) return null;
      var v = parseFloat(raw);
      if (!Number.isFinite(v)) return null;
      return Math.min(1, Math.max(0.001, v));
    } catch (e) {
      console.warn("perSongVolumeMemory: loadValue error", e);
      return null;
    }
  }

  // Save a single value
  function saveValue(type, songName, value){
    try {
      var k = _key(type, songName);
      var v = parseFloat(value);
      if (!Number.isFinite(v)) return;
      v = Math.min(1, Math.max(0.001, v));
      localStorage.setItem(k, v);
    } catch (e) {
      console.warn("perSongVolumeMemory: saveValue error", e);
    }
  }

  // Remove both saved values for a song (optional helper)
  function removeSong(songName){
    try {
      localStorage.removeItem(_key("vocal", songName));
      localStorage.removeItem(_key("accomp", songName));
    } catch (e) {
      console.warn("perSongVolumeMemory: removeSong error", e);
    }
  }

  // Load both values for a song; returns { vocal: number|null, accomp: number|null }
  function loadSongVolumes(songName){
    return {
      vocal: loadValue("vocal", songName),
      accomp: loadValue("accomp", songName)
    };
  }

  // API surface
  window.perSongVolumeMemory.loadSongVolumes = loadSongVolumes;
  window.perSongVolumeMemory.saveSongVolume = saveValue;
  window.perSongVolumeMemory.loadSongValue = loadValue;
  window.perSongVolumeMemory.removeSong = removeSong;

  // Optional convenience: apply stored volumes for a song (uses global setVolumeOnTargets if available).
  // This function will NOT overwrite UI unless setVolumeOnTargets updates the UI (it does in your audioControl.js).
  window.perSongVolumeMemory.applyStoredVolumesForSong = function(songName){
    var vals = loadSongVolumes(songName);
    if (vals.vocal !== null && typeof setVolumeOnTargets === "function"){
      setVolumeOnTargets("vocal", vals.vocal);
    }
    if (vals.accomp !== null && typeof setVolumeOnTargets === "function"){
      setVolumeOnTargets("accomp", vals.accomp);
    }
    return vals;
  };

})();
