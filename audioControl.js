// audioControl.js

let vocalAudio = null;
let accompAudio = null;

let currentLoop = null;
let isPlaying = false;

function prepareAudioFromDropbox() {
  console.log("audioControl.js: prepareAudioFromDropbox() called");

  const songName = window.selectedSongName;
  const vocalName = `${songName}_vocal.mp3`;
  const accName = `${songName}_acc.mp3`;

  const vocalUrl = `https://www.dropbox.com/scl/fi/${dropboxFileID}/${vocalName}?rlkey=${dropboxRlKey}&raw=1`;
  const accUrl   = `https://www.dropbox.com/scl/fi/${dropboxFileID}/${accName}?rlkey=${dropboxRlKey}&raw=1`;

  console.log("🎧 Vocal URL:", vocalUrl);
  console.log("🎹 Accompaniment URL:", accUrl);

  if (!vocalAudio) {
    vocalAudio = new Audio();
    vocalAudio.crossOrigin = "anonymous";
  }

  if (!accompAudio) {
    accompAudio = new Audio();
    accompAudio.crossOrigin = "anonymous";
  }

  vocalAudio.src = vocalUrl;
  accompAudio.src = accUrl;

  vocalAudio.oncanplaythrough = () => {
    console.log("✅ Vocal audio prepared");
  };
  accompAudio.oncanplaythrough = () => {
    console.log("✅ Accompaniment audio prepared");
  };

  vocalAudio.load();
  accompAudio.load();
}

function playBothFrom(startTime) {
  if (!vocalAudio || !accompAudio) {
    console.warn("⚠️ Audio not ready");
    return;
  }

  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  vocalAudio.play();
  accompAudio.play();
  isPlaying = true;
}

function stopBoth() {
  if (vocalAudio) vocalAudio.pause();
  if (accompAudio) accompAudio.pause();
  isPlaying = false;
}

function setVocalVolume(vol) {
  if (vocalAudio) vocalAudio.volume = vol;
}

function setAccompanimentVolume(vol) {
  if (accompAudio) accompAudio.volume = vol;
}

function playLoopSegment(start, end) {
  stopBoth();
  playBothFrom(start);

  currentLoop = setInterval(() => {
    if (vocalAudio.currentTime >= end || accompAudio.currentTime >= end) {
      stopBoth();
      clearInterval(currentLoop);
    }
  }, 200);
}

// Expose functions globally
window.prepareAudioFromDropbox = prepareAudioFromDropbox;
window.playLoopSegment = playLoopSegment;
window.setVocalVolume = setVocalVolume;
window.setAccompanimentVolume = setAccompanimentVolume;
