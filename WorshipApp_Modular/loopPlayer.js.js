console.log("🔁 loopPlayer.js: Starting...");

let loopSegments = [];
let currentLoopIndex = 0;
let loopPlaybackActive = false;
let loopPlaybackStarted = false;

// Wait for DOM and audio elements
document.addEventListener('DOMContentLoaded', () => {
  const vocalAudio = window.vocalAudio;
  const accompAudio = window.accompAudio;

  if (!vocalAudio || !accompAudio) {
    console.error("🎵 loopPlayer.js: Audio elements not found.");
    return;
  }

  // Start loop playback when user presses Play
  vocalAudio.addEventListener('play', () => {
    if (!loopPlaybackStarted) {
      loopPlaybackStarted = true;
      console.log("▶️ loopPlayer.js: Play started — loading loops...");
      loadLoopsJsonAndStart();
    }
  });

  // If user manually pauses, cancel loop playback
  vocalAudio.addEventListener('pause', () => {
    if (loopPlaybackActive) {
      console.log("⏸️ loopPlayer.js: Playback paused by user.");
      cancelLoopPlayback();
    }
  });
});

function loadLoopsJsonAndStart() {
  if (!window.selectedSongName) {
    console.error("❌ loopPlayer.js: selectedSongName is undefined.");
    return;
  }

  const songName = window.selectedSongName;
  const fileName = `${songName}_loops.json`;
  console.log(`📁 loopPlayer.js: Fetching ${fileName} from Dropbox...`);

  fetch('/.netlify/functions/getDropboxToken')
    .then(res => res.json())
    .then(tokenData => {
      const accessToken = tokenData.access_token;
      const dropboxPath = `/WorshipSongs/${fileName}`;
      const url = 'https://content.dropboxapi.com/2/files/download';

      return fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath })
        }
      });
    })
    .then(res => res.json())
    .then(json => {
      if (!json.segments || !Array.isArray(json.segments)) {
        throw new Error("Invalid or missing 'segments' array in JSON.");
      }
      loopSegments = json.segments;
      console.log(`✅ loopPlayer.js: Loaded ${loopSegments.length} segments.`);
      startLoopSequence();
    })
    .catch(err => {
      console.error("❌ loopPlayer.js: Error loading _loops.json", err);
    });
}

function startLoopSequence() {
  const vocal = window.vocalAudio;
  const accomp = window.accompAudio;

  if (!vocal || !accomp || loopSegments.length === 0) {
    console.error("🎵 loopPlayer.js: Missing audio elements or loop data.");
    return;
  }

  loopPlaybackActive = true;
  currentLoopIndex = 0;
  playCurrentLoop(vocal, accomp);
}

function playCurrentLoop(vocal, accomp) {
  if (currentLoopIndex >= loopSegments.length) {
    console.log("🛑 loopPlayer.js: All segments played. Stopping.");
    loopPlaybackActive = false;
    return;
  }

  const { start, end } = loopSegments[currentLoopIndex];
  if (start >= end) {
    console.warn(`⚠️ Skipping invalid segment: start=${start}, end=${end}`);
    currentLoopIndex++;
    playCurrentLoop(vocal, accomp);
    return;
  }

  console.log(`🎬 loopPlayer.js: Playing segment ${currentLoopIndex + 1}/${loopSegments.length}: ${start}s → ${end}s`);

  vocal.currentTime = start;
  accomp.currentTime = start;

  vocal.play();
  accomp.play();

  const duration = (end - start) * 1000;

  setTimeout(() => {
    vocal.pause();
    accomp.pause();
    currentLoopIndex++;
    if (loopPlaybackActive) {
      playCurrentLoop(vocal, accomp);
    }
  }, duration);
}

function cancelLoopPlayback() {
  loopPlaybackActive = false;
  currentLoopIndex = 0;
  loopPlaybackStarted = false;
  console.log("⛔ loopPlayer.js: Loop playback cancelled.");
}
