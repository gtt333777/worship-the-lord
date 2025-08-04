console.log("audioControl.js: Starting...");

let vocalAudio = new Audio();
let accompAudio = new Audio();

let vocalVolumeSlider, accompVolumeSlider;
let vocalPlus, vocalMinus, accompPlus, accompMinus;
let playButton;

let loops = [];
let currentLoopIndex = 0;
let isPlayingSegment = false;

document.addEventListener("DOMContentLoaded", () => {
  vocalVolumeSlider = document.getElementById("vocalVolume");
  accompVolumeSlider = document.getElementById("accompVolume");
  vocalPlus = document.getElementById("vocalPlus");
  vocalMinus = document.getElementById("vocalMinus");
  accompPlus = document.getElementById("accompPlus");
  accompMinus = document.getElementById("accompMinus");
  playButton = document.getElementById("playButton");

  setUpVolumeControls();
  setUpPlayButton();
});

function prepareAudioFromDropbox() {
  console.log("audioControl.js: prepareAudioFromDropbox() called");

  const songName = window.selectedSongName;
  const vocalName = `${songName}_vocal.mp3`;
  const accName = `${songName}_acc.mp3`;

  if (!window.dropboxFileID || !window.dropboxRlKey) {
    console.error("❌ Missing Dropbox ID or rlkey");
    return;
  }

  // Build raw URLs
  const buildUrl = (file) =>
    `https://www.dropbox.com/scl/fi/${window.dropboxFileID}/${encodeURIComponent(file)}?rlkey=${window.dropboxRlKey}&raw=1`;

  const vocalUrl = buildUrl(vocalName);
  const accUrl = buildUrl(accName);

  vocalAudio.src = vocalUrl;
  accompAudio.src = accUrl;

  vocalAudio.crossOrigin = "anonymous";
  accompAudio.crossOrigin = "anonymous";

  setAudioElements(vocalAudio, accompAudio);

  vocalAudio.onended = accompAudio.onended = () => {
    console.log("🔚 Playback ended");
    isPlayingSegment = false;
  };

  console.log("🎧 Vocal URL:", vocalUrl);
  console.log("🎹 Accompaniment URL:", accUrl);
}

// Called from songLoader.js after loading loops
function setAudioElements(vocal, accomp) {
  vocalAudio = vocal;
  accompAudio = accomp;
}

// Called from songLoader.js to update segment loop data
function setLoops(newLoops) {
  loops = newLoops;
}

// Handles segment click
function playSegmentFrom(index) {
  if (!loops.length || !vocalAudio.src || !accompAudio.src) {
    console.warn("Cannot play: Loops or audio not ready");
    return;
  }

  currentLoopIndex = index;
  isPlayingSegment = true;

  const start = loops[index].start;
  const end = loops[index].end;

  vocalAudio.currentTime = start;
  accompAudio.currentTime = start;

  vocalAudio.play();
  accompAudio.play();

  console.log(`🎵 Playing Segment ${index + 1}: ${start} → ${end}`);

  const stopPlayback = () => {
    vocalAudio.pause();
    accompAudio.pause();
    isPlayingSegment = false;
    console.log("🛑 Stopped after final segment");
  };

  const checkNext = () => {
    if (!isPlayingSegment) return;

    const currentTime = vocalAudio.currentTime;
    const loopEnd = loops[currentLoopIndex].end;

    if (currentTime >= loopEnd) {
      if (currentLoopIndex + 1 < loops.length) {
        currentLoopIndex++;
        const next = loops[currentLoopIndex];
        vocalAudio.currentTime = next.start;
        accompAudio.currentTime = next.start;
        console.log(`➡️ Segment ${currentLoopIndex + 1} started`);
      } else {
        stopPlayback();
      }
    }
  };

  clearInterval(window.segmentCheckTimer);
  window.segmentCheckTimer = setInterval(checkNext, 200);
}

function setUpPlayButton() {
  playButton.addEventListener("click", () => {
    if (!vocalAudio.src || !accompAudio.src) {
      alert("⚠️ Audio not loaded yet.");
      return;
    }

    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
    vocalAudio.play();
    accompAudio.play();
    console.log("▶️ Full song playback started");
  });
}

function setUpVolumeControls() {
  const adjustVolume = (slider, delta) => {
    slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
    slider.dispatchEvent(new Event("input"));
  };

  vocalPlus.addEventListener("click", () => adjustVolume(vocalVolumeSlider, 0.05));
  vocalMinus.addEventListener("click", () => adjustVolume(vocalVolumeSlider, -0.05));
  accompPlus.addEventListener("click", () => adjustVolume(accompVolumeSlider, 0.05));
  accompMinus.addEventListener("click", () => adjustVolume(accompVolumeSlider, -0.05));

  vocalVolumeSlider.addEventListener("input", () => {
    vocalAudio.volume = parseFloat(vocalVolumeSlider.value);
  });

  accompVolumeSlider.addEventListener("input", () => {
    accompAudio.volume = parseFloat(accompVolumeSlider.value);
  });
}
