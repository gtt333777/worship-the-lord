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

  if (!window.currentAudioUrls) {
    console.warn("No audio URLs found yet");
    return;
  }

  const { vocalUrl, accUrl, accessToken, vocalName, accName } = window.currentAudioUrls;

  const vocalArg = `{"path": "/WorshipSongs/${vocalName}"}`;
  const accArg = `{"path": "/WorshipSongs/${accName}"}`;

  // 🎤 Fetch vocal MP3
  fetch(vocalUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": vocalArg
    }
  })
    .then(res => res.blob())
    .then(blob => {
      vocalAudio.src = URL.createObjectURL(blob);
      console.log("🎧 Vocal audio prepared");
    })
    .catch(err => console.error("❌ Failed to load vocal:", err));

  // 🎹 Fetch accompaniment MP3
  fetch(accUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": accArg
    }
  })
    .then(res => res.blob())
    .then(blob => {
      accompAudio.src = URL.createObjectURL(blob);
      console.log("🎹 Accompaniment audio prepared");
    })
    .catch(err => console.error("❌ Failed to load accompaniment:", err));
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
