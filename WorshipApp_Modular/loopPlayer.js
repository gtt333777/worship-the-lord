console.log("🔁 loopPlayer.js: Starting...");

let loopSegments = [];
let currentLoopIndex = 0;
let loopPlaybackActive = false;
let loopPlaybackStarted = false;

function loadLoopsJsonAndStart(vocalAudio, accompAudio) {
  const songName = window.selectedSongName;
  if (!songName) {
    console.error("❌ loopPlayer.js: selectedSongName is not defined.");
    return;
  }

  const fileName = `${songName}_loops.json`;
  console.log(`📂 Trying to fetch: ${fileName}`);

  fetch('/.netlify/functions/getDropboxToken')
    .then(res => {
      if (!res.ok) throw new Error("❌ Failed to get Dropbox token");
      return res.json();
    })
    .then(tokenData => {
      const accessToken = tokenData.access_token;
      const dropboxPath = `/WorshipSongs/${fileName}`;
      const url = 'https://content.dropboxapi.com/2/files/download';

      console.log("🔑 Got Dropbox token, requesting:", dropboxPath);

      return fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath })
        }
      });
    })
    .then(res => {
      if (!res.ok) {
        console.error("❌ Failed to download _loops.json:", res.status);
        throw new Error("Dropbox download failed");
      }
      return res.json();
    })
    .then(json => {
      if (!json.segments || !Array.isArray(json.segments)) {
        throw new Error("❌ 'segments' array missing or invalid in JSON");
      }
      loopSegments = json.segments;
      console.log(`✅ Loaded ${loopSegments.length} loop segments.`);
      startLoopSequence(vocalAudio, accompAudio);
    })
    .catch(err => {
      console.error("🚨 loopPlayer.js: Error during loop loading", err);
    });
}

function startLoopSequence(vocal, accomp) {
  if (!vocal || !accomp || loopSegments.length === 0) {
    console.error("❌ Cannot start loops — missing data or audio elements.");
    return;
  }

  loopPlaybackActive = true;
  currentLoopIndex = 0;
  playCurrentLoop(vocal, accomp);
}

function playCurrentLoop(vocal, accomp) {
  if (currentLoopIndex >= loopSegments.length) {
    console.log("✅ All loop segments completed. Stopping playback.");
    loopPlaybackActive = false;
    return;
  }

  const { start, end } = loopSegments[currentLoopIndex];

  if (typeof start !== 'number' || typeof end !== 'number' || start >= end) {
    console.warn(`⚠️ Invalid segment skipped: index ${currentLoopIndex}`, { start, end });
    currentLoopIndex++;
    playCurrentLoop(vocal, accomp);
    return;
  }

  console.log(`🎯 Playing segment ${currentLoopIndex + 1}: ${start}s → ${end}s`);

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

// ✅ Expose globally so audioControl.js can call it
window.startLoopSequence = function (vocal, accomp) {
  if (!loopPlaybackStarted) {
    loopPlaybackStarted = true;
    console.log("▶️ LoopPlayer: Playback started — loading _loops.json...");
    loadLoopsJsonAndStart(vocal, accomp);
  } else {
    console.log("🔁 LoopPlayer: Already started. Skipping re-initialization.");
  }
};
