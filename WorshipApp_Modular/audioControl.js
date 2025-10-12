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
  const MIN_VOL = 0.03; // set your desired minimum volume

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




// --- Set initial volumes on load ---
window.addEventListener("load", () => {
  const defaults = {
    vocal: 0.03,
    accomp: 0.15
  };

  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);

    if (slider && audio) {
      slider.value = defaults[type].toFixed(2);
      audio.volume = defaults[type];
      // Fire an input event so UI stays in sync
      slider.dispatchEvent(new Event("input"));
    }
  });
});



/*

// --- Reset volumes to defaults whenever a new song loads ---
(function enforceDefaultPerSong() {
  const defaults = {
    vocal: 0.03,   // default vocal volume
    accomp: 0.30   // default accompaniment volume
  };

  ["vocal", "accomp"].forEach(type => {
    const audio = (type === "vocal" ? vocalAudio : accompAudio);
    const slider = document.getElementById(`${type}Volume`);
    if (!audio || !slider) return;

    // Fired whenever a new source is ready to play
    audio.addEventListener("loadedmetadata", () => {
      const defVal = defaults[type];
      slider.value = defVal.toFixed(2);
      audio.volume = defVal;

      // Trigger input so your existing slider change listeners sync
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      console.log(`🎚️ ${type} reset to default for new song: ${defVal}`);
    });
  });
})();

*/


/*
// === Live Volume Display ===
(function setupVolumeDisplays() {
  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    const display = document.getElementById(`${type}VolumeDisplay`);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);

    if (!slider || !display || !audio) return;

    // Initialize display
    display.textContent = slider.value;

    // Update when user moves the slider
    slider.addEventListener("input", () => {
      let val = parseFloat(slider.value).toFixed(2);
      display.textContent = val;
      audio.volume = val;
    });

    // Update when using + / - buttons
    const originalAdjustVolume = window.adjustVolume;
    window.adjustVolume = function(t, delta) {
      originalAdjustVolume(t, delta);
      if (t === type) {
        display.textContent = parseFloat(slider.value).toFixed(2);
      }
    };
  });
})();

*/

// === Live Volume Display (fixed, no override) ===
(function setupVolumeDisplays() {
  ["vocal", "accomp"].forEach(type => {
    const slider = document.getElementById(`${type}Volume`);
    const display = document.getElementById(`${type}VolumeDisplay`);
    const audio = (type === "vocal" ? vocalAudio : accompAudio);

    if (!slider || !display || !audio) return;

    // Initialize display
    display.textContent = parseFloat(slider.value).toFixed(2);

    // Update display + volume whenever slider moves
    slider.addEventListener("input", () => {
      const val = parseFloat(slider.value).toFixed(2);
      display.textContent = val;
      audio.volume = val;
    });

    // Update display whenever slider changes (e.g., via + / - buttons)
    slider.addEventListener("change", () => {
      display.textContent = parseFloat(slider.value).toFixed(2);
    });
  });
})();
