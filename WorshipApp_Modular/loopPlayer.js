console.log("🔁 loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", function () {
  console.log("🔁 loopPlayer.js: DOMContentLoaded – waiting for audio to be initialized.");

  function waitForAudioAndSong() {
    const vocal = window.vocalAudio;
    const accomp = window.accompAudio;
    const currentSong = window.currentSongName;

    if (!vocal || !accomp || !currentSong) {
      console.warn("⏳ loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName...");
      setTimeout(waitForAudioAndSong, 300);
      return;
    }

    console.log("✅ loopPlayer.js: Found global vocalAudio and accompAudio.");
    console.log("🎵 Current song:", currentSong);

    fetchLoopJsonAndPlay(currentSong, vocal, accomp);
  }

  waitForAudioAndSong();
});

function fetchLoopJsonAndPlay(songName, vocalAudio, accompAudio) {
  const prefix = songName.trim(); // exact match with spaces
  const loopUrl = `https://content.dropboxapi.com/2/files/download`;

  fetch("/.netlify/functions/getDropboxToken")
    .then((res) => res.json())
    .then((data) => {
      const token = data.access_token;
      const path = `/WorshipSongs/${prefix}_loops.json`;

      console.log("📥 loopPlayer.js: Attempting to fetch:", path);

      return fetch(loopUrl, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Dropbox-API-Arg": JSON.stringify({ path }),
        },
      });
    })
    .then((res) => {
      if (!res.ok) throw new Error(`❌ Failed to load loops JSON`);
      return res.json();
    })
    .then((loopData) => {
      console.log("✅ loopPlayer.js: Fetched loops:", loopData);
      startLoopSequence(vocalAudio, accompAudio, loopData);
    })
    .catch((err) => {
      console.error("🔥 loopPlayer.js Error:", err.message);
    });
}

function startLoopSequence(vocal, accomp, loops) {
  if (!Array.isArray(loops)) {
    console.error("❌ startLoopSequence: Invalid loop data.");
    return;
  }

  let current = 0;
  console.log("🎯 Loop Playback Started: Playing segments in order...");

  function playSegment(index) {
    if (index >= loops.length) {
      console.log("✅ Finished all loops.");
      return;
    }

    const { start, end } = loops[index];
    console.log(`🎼 Playing Segment ${index + 1}: ${start}s → ${end}s`);

    vocal.currentTime = start;
    accomp.currentTime = start;
    vocal.play();
    accomp.play();

    const duration = (end - start) * 1000;
    setTimeout(() => {
      vocal.pause();
      accomp.pause();
      playSegment(index + 1);
    }, duration);
  }

  playSegment(current);
}

// Allow Play button to retrigger loop mode
window.startLoopSequence = startLoopSequence;
