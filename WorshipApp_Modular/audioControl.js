/* ============================================================
   audioControl.js — FINAL STABLE BUILD (v3)
   With LocalStorage Persistence + Per-Song Persistence
   ============================================================ */

var MIN_VOL = 0.001;
window.DEFAULTS = window.DEFAULTS || { vocal: 0.002, accomp: 0.02 };
var DEFAULTS = window.DEFAULTS;

window.vocalAudio =
  document.querySelector('audio[data-role="vocal"]') ||
  window.vocalAudio ||
  new Audio();

window.accompAudio =
  document.querySelector('audio[data-role="accomp"]') ||
  window.accompAudio ||
  new Audio();

window._volumesInitialized = window._volumesInitialized ?? false;

window._userTouched  = window._userTouched  ?? { vocal: false, accomp: false };
window._userVolume   = window._userVolume   ?? { vocal: null,  accomp: null  };

function getSlider(type){ return document.getElementById(type+"Volume"); }
function getDisplay(type){ return document.getElementById(type+"VolumeDisplay"); }

function isVocalMuted(){ return !!window._vocalIsMuted; }


/* ============================================================
   Unified Volume Writer (respects mute + persistence)
   ============================================================ */
function setVolumeOnTargets(type, numericValue){

  numericValue = parseFloat(numericValue);
  if (!Number.isFinite(numericValue)) numericValue = DEFAULTS[type];

  var uiValue = Math.min(1, Math.max(MIN_VOL, Number(numericValue.toFixed(2))));
  var realNumeric = uiValue;

  if (type === "vocal" && isVocalMuted()) realNumeric = MIN_VOL;

  const targetAudio = (type === "vocal") ? window.vocalAudio : window.accompAudio;
  if (targetAudio) targetAudio.volume = realNumeric;

  document.querySelectorAll("audio").forEach(a=>{
    const id    = (a.id||"").toLowerCase();
    const role  = (a.getAttribute("data-role")||"").toLowerCase();
    if(id.includes(type) || role.includes(type)) a.volume = realNumeric;
  });

  const sl = getSlider(type);
  const ds = getDisplay(type);
  if (sl) sl.value = uiValue.toFixed(2);
  if (ds) ds.textContent = uiValue.toFixed(2);
}


/* ============================================================
   Persistence Loader
   ============================================================ */
function loadStoredVolume(type){
  let v = localStorage.getItem(type + "Volume");
  if (v === null) return null;
  v = parseFloat(v);
  if (!Number.isFinite(v)) return null;
  return Math.min(1, Math.max(MIN_VOL, v));
}


/* ============================================================
   syncDisplayAndVolume — user manually moves slider
   ============================================================ */
function syncDisplayAndVolume(type){
  const sl = getSlider(type);
  const ds = getDisplay(type);
  if (!sl) return;

  let val = parseFloat(sl.value);
  if(!Number.isFinite(val)) val = DEFAULTS[type];
  val = Math.min(1, Math.max(MIN_VOL, val));

  window._userTouched[type] = true;
  window._userVolume[type]  = val;

  // 💾 store global value
  localStorage.setItem(type + "Volume", val);

  // 💾 store per-song value (NEW)
  if (window.currentSongName && window.perSongVolumeMemory) {
    if (typeof window.perSongVolumeMemory.saveSongVolume === "function") {
      window.perSongVolumeMemory.saveSongVolume(type, window.currentSongName, val);
    }
  }

  sl.value = val.toFixed(2);
  if (ds) ds.textContent = val.toFixed(2);

  setVolumeOnTargets(type, val);
}


/* ============================================================
   adjustVolume — plus/minus buttons
   ============================================================ */
function adjustVolume(type, delta){
  const sl = getSlider(type);
  const ds = getDisplay(type);
  if (!sl) return;

  let newVal = parseFloat(sl.value) + delta;
  if (!Number.isFinite(newVal)) newVal = DEFAULTS[type];
  newVal = Math.min(1, Math.max(MIN_VOL, newVal));

  window._userTouched[type] = true;
  window._userVolume[type]  = newVal;

  // 💾 store global value
  localStorage.setItem(type + "Volume", newVal);

  // 💾 store per-song value (NEW)
  if (window.currentSongName && window.perSongVolumeMemory) {
    if (typeof window.perSongVolumeMemory.saveSongVolume === "function") {
      window.perSongVolumeMemory.saveSongVolume(type, window.currentSongName, newVal);
    }
  }

  sl.value = newVal.toFixed(2);
  if (ds) ds.textContent = newVal.toFixed(2);

  if (type === "vocal" && isVocalMuted()){
    // If muted → only store, don't write to audio
    window._savedVocalVolume = newVal;
    return;
  }

  setVolumeOnTargets(type, newVal);
}

window.adjustVolume = adjustVolume;


/* ============================================================
   Initialize slider positions (default only once)
   ============================================================ */
function initAudioControls(){

  ["vocal", "accomp"].forEach(type => {

    const sl = getSlider(type);
    const ds = getDisplay(type);
    if (!sl) return;

    sl.addEventListener("input",  ()=>syncDisplayAndVolume(type));
    sl.addEventListener("change", ()=>syncDisplayAndVolume(type));

    let startVal = null;

    // 1️⃣ If stored in localStorage → highest priority
    const stored = loadStoredVolume(type);
    if (stored !== null){
      startVal = stored;
      window._userTouched[type] = true;
      window._userVolume[type]  = stored;
    }

    // 2️⃣ If no stored value → use default (only once)
    if (startVal === null){
      startVal = DEFAULTS[type];
    }

    startVal = Math.min(1, Math.max(MIN_VOL, startVal));

    sl.value = startVal.toFixed(2);
    if (ds) ds.textContent = startVal.toFixed(2);

    setVolumeOnTargets(type, startVal);
  });

  window._volumesInitialized = true;
}


/* ============================================================
   DOM Ready
   ============================================================ */
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", initAudioControls, {once:true});
}else{
  initAudioControls();
}

window.addEventListener("load", ()=>{
  if (!window._volumesInitialized) initAudioControls();
});


/* ============================================================
   Allow TURBO mode to trigger the real Play
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playBtn");
  if (!playBtn) return;

  // When Turbo mode dispatches "actualPlay", run the real Play
  playBtn.addEventListener("actualPlay", () => playBtn.click());
});
