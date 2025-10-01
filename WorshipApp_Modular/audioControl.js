// audioControl.js

// Global audio elements
if (!window.vocalAudio) window.vocalAudio = new Audio();
if (!window.accompAudio) window.accompAudio = new Audio();

["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("change", e => {
    (type === "vocal" ? vocalAudio : accompAudio).volume = parseFloat(e.target.value);
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta)).toFixed(2);
  slider.dispatchEvent(new Event("input"));
}

window.adjustVolume = adjustVolume;



/*
Please go through below code and advise whether it controls the volume: ChatGPT answered

It is fine because too many times, if it fires vocal and accompaniment mismatches. 
Now the issue is, if the user brings down the volume to zero the above same mismatch happens. 
In order to avoid this, please give me code so that I can paste at the end of this file, 
which will ensure that even if the slider is pushed far left by the user, 
it will not reach zero, that is it will stop at minimum point.

Got it 👍 — you want to clamp the slider so it never reaches 0 (mute), 
because that causes mismatch between vocal and accompaniment.

You can achieve this by intercepting the slider values 
after the user changes them and forcing a minimum floor (say 0.05 instead of 0).

Here’s a block you can safely paste at the end of audioControl.js:
*/

// --- Prevent volume sliders from reaching absolute zero ---
(function enforceMinVolume() {
  const MIN_VOL = 0.07; // set your desired minimum volume

  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    if (!slider) return;

    slider.addEventListener("change", e => {
      let val = parseFloat(e.target.value);
      if (val <= 0) {
        val = MIN_VOL;
        slider.value = val.toFixed(2);
        (type === "vocal" ? vocalAudio : accompAudio).volume = val;
      }
    });
  });
})();
