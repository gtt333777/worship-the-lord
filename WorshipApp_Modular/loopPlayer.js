console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false;

function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  // Cancel any previous segment playback
  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    activeSegmentTimeout = null;
  }
  vocalAudio.pause();
  accompAudio.pause();
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  // ✅ Use Promise.all to ensure both play together
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      currentlyPlaying = true;

      const duration = (endTime - startTime) * 1000;
      activeSegmentTimeout = setTimeout(() => {
        console.log("🔚 Segment ended.");
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;

        // 🔁 Auto-play next segment
        if (index < segments.length - 1) {
          const nextSegment = segments[index + 1];
          playSegment(nextSegment.start, nextSegment.end, index + 1);
        }
      }, duration);
    })
    .catch(err => {
      console.warn("⚠️ loopPlayer.js: playSegment Promise.all error:", err);
    });
}

let activeSegmentTimeout = null;
let currentPlayingSegmentIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");
  if (!loopButtonsDiv) {
    console.warn("loopPlayer.js: #loopButtonsContainer not found");
    return;
  }

  const songNameDropdown = document.getElementById("songSelect");
  if (!songNameDropdown) {
    console.warn("loopPlayer.js: #songSelect not found");
    return;
  }



  /*
  function getDropboxFileURL(filename) {
  // Replace with your actual Dropbox public link format
  // Example: https://www.dl.dropboxusercontent.com/s/XXXXX/filename
  return `https://www.dl.dropboxusercontent.com/s/your_unique_code/${filename}`;
}
*/

  songNameDropdown.addEventListener("change", () => {


    // 🔹 Stop & clear old audio before loading new song
  if (window.vocalAudio) {
    vocalAudio.pause();
    vocalAudio.src = "";
  }
  if (window.accompAudio) {
    accompAudio.pause();
    accompAudio.src = "";
  }

    const selectedTamilName = songNameDropdown.value;
    console.log("🎵 loopPlayer.js: Song selected ->", selectedTamilName);

    const loopFile = `lyrics/${selectedTamilName}_loops.json`;

    console.log("📁 Trying to fetch loop file:", loopFile);

    fetch(loopFile)
      .then((response) => {
        if (!response.ok) throw new Error(`Loop file not found: ${loopFile}`);
        return response.json();
      })
      .then((loopData) => {
        console.log("✅ Loop data loaded:", loopData);
        segments = loopData;

         renderSegments();



    // 🔹 NEW: Preload MP3s immediately
    if (selectedTamilName) {
        const vocalUrl = getDropboxFileURL(selectedTamilName + "_vocal.mp3");
        const accUrl = getDropboxFileURL(selectedTamilName + "_acc.mp3");

        vocalAudio.src = vocalUrl;
        accompAudio.src = accUrl;

        vocalAudio.preload = "auto";
        accompAudio.preload = "auto";

        Promise.all([
            vocalAudio.play().catch(() => {}),
            accompAudio.play().catch(() => {})
        ]).then(() => {
            vocalAudio.pause();
            accompAudio.pause();
            vocalAudio.currentTime = 0;
            accompAudio.currentTime = 0;
            console.log("✅ Preloaded new song audio:", selectedTamilName);
        });
    }
})
.catch(err => console.error("❌ Error loading loop file:", err));













        // Clear existing buttons
        loopButtonsDiv.innerHTML = "";

        // Create segment buttons
        
        /*
          loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;
          btn.addEventListener("click", () => {
            playSegment(segment.start, segment.end, index);
          });
          loopButtonsDiv.appendChild(btn);
        });

        */
        

        // Create segment buttons
          /*loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;

          
          btn.addEventListener("click", () => {
        // Simulate 3 quick taps to remove vocal sluggishness
          playSegment(segment.start, segment.end, index);
          setTimeout(() => playSegment(segment.start, segment.end, index), 500);
          //setTimeout(() => playSegment(segment.start, segment.end, index), 140);
          //setTimeout(() => playSegment(segment.start, segment.end, index), 210);
         });

         loopButtonsDiv.appendChild(btn);
         });
         */


         //This is the version I recommend. It waits for each audio to reach a usable state (canplay / readyState >= 2) before calling playSegment (so playSegment can set currentTime first). Paste this in place of the old handler:
         loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;

         btn.addEventListener("click", () => {
  if (!vocalAudio.src || !accompAudio.src) {
    const songName = document.getElementById("songSelect").value;
    if (!songName) {
      console.warn("⚠️ No song selected.");
      return;
    }

    // Prevent duplicate loads if user clicks multiple times quickly
    if (window._worship_audio_loading) {
      console.log("⏳ Audio load already in progress...");
      return;
    }
    window._worship_audio_loading = true;

    const vocalUrl = getDropboxFileURL(songName + "_vocal.mp3");
    const accUrl = getDropboxFileURL(songName + "_acc.mp3");

    vocalAudio.src = vocalUrl;
    accompAudio.src = accUrl;
    vocalAudio.preload = "auto";
    accompAudio.preload = "auto";

    // Wait for both audio elements to be able to play (canplay)
    const waitVocal = new Promise(resolve => {
      if (vocalAudio.readyState >= 2) return resolve();
      const onCan = () => { vocalAudio.removeEventListener("canplay", onCan); resolve(); };
      vocalAudio.addEventListener("canplay", onCan);
    });

    const waitAcc = new Promise(resolve => {
      if (accompAudio.readyState >= 2) return resolve();
      const onCan = () => { accompAudio.removeEventListener("canplay", onCan); resolve(); };
      accompAudio.addEventListener("canplay", onCan);
    });

    Promise.all([waitVocal, waitAcc]).then(() => {
      // Now both have metadata/canplay — call your normal routine, which will set currentTime then play
      playSegment(segment.start, segment.end, index);
      // optional duplicate call (sluggishness workaround)
      setTimeout(() => playSegment(segment.start, segment.end, index), 500);
    }).catch(err => {
      console.warn("⚠️ Error waiting audio readiness:", err);
    }).finally(() => {
      window._worship_audio_loading = false;
    });

  } else {
    // already loaded
    playSegment(segment.start, segment.end, index);
    setTimeout(() => playSegment(segment.start, segment.end, index), 500);
  }
});

  // ✅ This is the line that makes it visible
  loopButtonsDiv.appendChild(btn);
});










        // ✅ Notify segmentProgressVisualizer.js
        if (typeof startSegmentProgressVisualizer === "function") {
          const loopButtonsContainer = document.getElementById("loopButtonsContainer");
          startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsContainer);
        }
      })
      .catch((error) => {
        console.warn("❌ loopPlayer.js: Error loading loop file:", error);
      });
  });
});

// ✅ Auto-retry playback if audio not ready
function checkReadyAndPlay(startTime, endTime, index = 0) {
  const isReady = vocalAudio.readyState >= 2 && accompAudio.readyState >= 2;

  if (!isReady) {
    console.warn("⏳ loopPlayer.js: Audio not ready yet...");
    setTimeout(() => checkReadyAndPlay(startTime, endTime, index), 200);
    return;
  }

  console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  // ✅ Use Promise.all here as well
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      currentlyPlaying = true;

      const duration = (endTime - startTime) * 1000;
      setTimeout(() => {
        console.log("🔚 Segment ended.");
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;

        // 🔁 Auto-play next segment
        if (index < segments.length - 1) {
          const nextSegment = segments[index + 1];
          playSegment(nextSegment.start, nextSegment.end, index + 1);
        }
      }, duration);
    })
    .catch(err => {
      console.warn("⚠️ loopPlayer.js: checkReadyAndPlay Promise.all error:", err);
    });
}
