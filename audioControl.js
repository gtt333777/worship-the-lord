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
  const accessToken = window.latestDropboxAccessToken;

  if (!songName || !accessToken) {
    console.warn("⛔ Missing songName or Dropbox token");
    return;
  }

  const vocalName = `${songName}_vocal.mp3`;
  const accName = `${songName}_acc.mp3`;

  const vocalUrl = "https://content.dropboxapi.com/2/files/download";
  const accUrl = "https://content.dropboxapi.com/2/files/download";

  // Vocal fetch
  fetch(vocalUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/WorshipSongs/${vocalName}`
      })
    }
  })
    .then(res => res.blob())
    .then(blob => {
      vocalAudio.src = URL.createObjectURL(blob);
      console.log("🎧 Vocal audio ready");
    })
    .catch(err => {
      console.error("❌ Error loading vocal:", err);
    });

  // Accompaniment fetch
  fetch(accUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/WorshipSongs/${accName}`
      })
    }
  })
    .then(res => res.blob())
    .then(blob => {
      accompAudio.src = URL.createObjectURL(blob);
      console.log("🎹 Accompaniment audio ready");
    })
    .catch(err => {
      console.error("❌ Error loading accompaniment:", err);
    });

  vocalAudio.crossOrigin = "anonymous";
  accompAudio.crossOrigin = "anonymous";

  vocalAudio.onended = accompAudio.onended = () => {
    console.log("🔚 Playback ended");
    isPlayingSegment = false;
  };
}

// Segment logic
function setLoops(newLoops) {
  loops = newLoops;
}

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
    console.log("🛑 Playback stopped after last segment");
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
