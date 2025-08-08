// WorshipApp_Modular/audioControl.js
// ✅ Global audio elements are defined in songLoader.js

["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("input", e => {
    (type === "vocal" ? vocalAudio : accompAudio).volume = parseFloat(e.target.value);
    correctDriftNow(); // ✅ keep sync when adjusting volume
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta)).toFixed(2);
  slider.dispatchEvent(new Event("input"));
}

window.adjustVolume = adjustVolume;
