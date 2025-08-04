// audioControl.js

let vocalAudio = null;
let accompAudio = null;

let segmentStart = 0;
let segmentEnd = 0;
let isSegmentPlay = false;

let loopSegments = [];
let currentLoopIndex = 0;
let playFromLoop = null;

// ✅ These will be set in songLoader.js
let dropboxBaseLink = "https://www.dropbox.com/scl/fi";
let dropboxFileID = ""; // e.g., g2pay3hdqgkimrb5tt0rw
let dropboxRlKey = "";  // e.g., sagx3mo3wl2h9oa2n4fbp4q13

function prepareAudioFromDropbox(vocalFilename, accompFilename) {
  const vocalUrl = `${dropboxBaseLink}/${vocalFilename}?rlkey=${dropboxRlKey}&raw=1`;
  const accompUrl = `${dropboxBaseLink}/${accompFilename}?rlkey=${dropboxRlKey}&raw=1`;

  console.log("🎤 Vocal URL:", vocalUrl);
  console.log("🎼 Accompaniment URL:", accompUrl);

  vocalAudio = new Audio(vocalUrl);
  accompAudio = new Audio(accompUrl);

  vocalAudio.crossOrigin = "anonymous";
  accompAudio.crossOrigin = "anonymous";

  vocalAudio.volume = document.getElementById("vocalVolumeSlider").value;
  accompAudio.volume = document.getElementById("accompVolumeSlider").value;

  console.log("✅ Vocal audio prepared");
  console.log("✅ Accompaniment audio prepared");
}

function playAudio() {
  if (!vocalAudio || !accompAudio) {
    alert("Please select a song first.");
    return;
  }

  if (isSegmentPlay) {
    vocalAudio.currentTime = segmentStart;
    accompAudio.currentTime = segmentStart;
    vocalAudio.play();
    accompAudio.play();
    monitorSegmentEnd();
  } else if (playFromLoop !== null) {
    currentLoopIndex = playFromLoop;
    playLoopSegment(currentLoopIndex);
  } else {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
    vocalAudio.play();
    accompAudio.play();
  }
}

function monitorSegmentEnd() {
  const interval = setInterval(() => {
    if (vocalAudio.currentTime >= segmentEnd || accompAudio.currentTime >= segmentEnd) {
      vocalAudio.pause();
      accompAudio.pause();
      clearInterval(interval);
    }
  }, 200);
}

function updateVolume(type, change) {
  const slider = document.getElementById(type === "vocal" ? "vocalVolumeSlider" : "accompVolumeSlider");
  let newValue = parseFloat(slider.value) + change;
  newValue = Math.max(0, Math.min(1, newValue));
  slider.value = newValue;
  if (type === "vocal" && vocalAudio) vocalAudio.volume = newValue;
  if (type === "accomp" && accompAudio) accompAudio.volume = newValue;
}

function setSegment(start, end) {
  segmentStart = start;
  segmentEnd = end;
  isSegmentPlay = true;
}

function clearSegment() {
  isSegmentPlay = false;
}

function loadLoopSegments(segments) {
  loopSegments = segments;
  console.log("✅ Loop segments loaded:", loopSegments);
}

function playLoopSegment(index) {
  if (index >= loopSegments.length) {
    vocalAudio.pause();
    accompAudio.pause();
    return;
  }

  const segment = loopSegments[index];
  const start = segment.start;
  const end = segment.end;

  vocalAudio.currentTime = start;
  accompAudio.currentTime = start;

  vocalAudio.play();
  accompAudio.play();

  const interval = setInterval(() => {
    if (vocalAudio.currentTime >= end || accompAudio.currentTime >= end) {
      clearInterval(interval);
      currentLoopIndex++;
      playLoopSegment(currentLoopIndex);
    }
  }, 200);
}
