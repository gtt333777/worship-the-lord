// WorshipApp_Modular/loopPlayer.js
console.log("loopPlayer.js: Starting...");

document.addEventListener('DOMContentLoaded', () => {
  console.log("loopPlayer.js: DOMContentLoaded – checking for global readiness...");

  const checkGlobalsReady = () => {
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;
    const currentSongName = window.currentSongName;

    if (!vocalAudio || !accompAudio || !currentSongName) {
      console.warn(`loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName... (attempt ${checkGlobalsReady.attempts + 1})`);
      checkGlobalsReady.attempts++;
      if (checkGlobalsReady.attempts < 10) {
        setTimeout(checkGlobalsReady, 300);
      } else {
        console.error("loopPlayer.js: ❌ Failed to find required global variables.");
      }
      return;
    }

    console.log("✅ loopPlayer.js: All globals ready!");
    initLoopPlayer(vocalAudio, accompAudio, currentSongName);
  };

  checkGlobalsReady.attempts = 0;
  checkGlobalsReady();
});

function initLoopPlayer(vocalAudio, accompAudio, currentSongName) {
  const loopButtonsContainer = document.getElementById('loopButtonsContainer');
  if (!loopButtonsContainer) {
    console.warn("loopPlayer.js: loopButtonsContainer not found");
    return;
  }

  // Clear old buttons
  loopButtonsContainer.innerHTML = '';

  const loopsUrl = `https://content.dropboxapi.com/2/files/download`;
  const dropboxPath = `/WorshipSongs/${currentSongName}_loops.json`;

  fetch('/.netlify/functions/getDropboxToken')
    .then(res => res.json())
    .then(tokenData => {
      return fetch(loopsUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + tokenData.access_token,
          'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath })
        }
      });
    })
    .then(response => {
      if (!response.ok) throw new Error("Could not fetch loop JSON");
      return response.json();
    })
    .then(loops => {
      console.log("🎯 Loaded loops:", loops);

      loops.forEach((loop, index) => {
        const button = document.createElement('button');
        button.textContent = `Segment ${index + 1}`;
        button.addEventListener('click', () => {
          playSegment(loops, index);
        });
        loopButtonsContainer.appendChild(button);
      });
    })
    .catch(error => {
      console.error("loopPlayer.js: Failed to load loops:", error);
    });

  function playSegment(loops, index) {
    const loop = loops[index];
    if (!loop) return;

    const start = loop.start;
    const end = loop.end;

    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    vocalAudio.play();
    accompAudio.play();

    clearInterval(window.segmentInterval);
    window.segmentInterval = setInterval(() => {
      if (vocalAudio.currentTime >= end || accompAudio.currentTime >= end) {
        if (index + 1 < loops.length) {
          playSegment(loops, index + 1); // Play next
        } else {
          vocalAudio.pause();
          accompAudio.pause();
          clearInterval(window.segmentInterval);
        }
      }
    }, 200);
  }
}
