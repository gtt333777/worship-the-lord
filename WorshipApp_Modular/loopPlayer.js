// loopPlayer.js
console.log("🎵 loopPlayer.js: Starting...");

let segments = [];
let currentlyPlaying = false; // note: also mirrored in songLoader.js as global variable
let activeSegmentTimeout = null;
let currentPlayingSegmentIndex = null;

// Helper: wait until both audio elements reach readyState >= 2 (HAVE_CURRENT_DATA/HAVE_FUTURE_DATA)
function waitForAudioReady(callback, retryDelay = 200) {
  const ready = (window.vocalAudio && window.accompAudio &&
                 window.vocalAudio.readyState >= 2 && window.accompAudio.readyState >= 2);
  if (ready) {
    callback();
  } else {
    // Keep polling until ready
    setTimeout(() => waitForAudioReady(callback, retryDelay), retryDelay);
  }
}

// Keep your checkReadyAndPlay behavior but make it resilient and global
function checkReadyAndPlay(startTime, endTime, index = 0) {
  // Ensure the audio srcs are set by the caller before calling this
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    setTimeout(() => checkReadyAndPlay(startTime, endTime, index), 200);
    return;
  }

  const isReady = vocalAudio.readyState >= 2 && accompAudio.readyState >= 2;

  if (!isReady) {
    console.warn("⏳ loopPlayer.js: Audio not ready yet...");
    setTimeout(() => checkReadyAndPlay(startTime, endTime, index), 200);
    return;
  }

  console.log(`🎧 loopPlayer.js: ✅ Playing segment ${index + 1}`);
  // Set both currentTime to start
  try {
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;
  } catch (err) {
    console.warn("⚠️ Could not set currentTime before play:", err);
  }

  // Use Promise.all to ensure both start together
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      currentlyPlaying = true;
      currentPlayingSegmentIndex = index;

      const duration = (endTime - startTime) * 1000;

      // Clear previous timeout if any
      if (activeSegmentTimeout) {
        clearTimeout(activeSegmentTimeout);
        activeSegmentTimeout = null;
      }

      activeSegmentTimeout = setTimeout(() => {
        console.log("🔚 Segment ended.");
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;
        activeSegmentTimeout = null;
        currentPlayingSegmentIndex = null;

        // Auto-play next segment if present
        if (index < segments.length - 1) {
          const nextSegment = segments[index + 1];
          // Small delay so currentTime set operations are safe
          playSegment(nextSegment.start, nextSegment.end, index + 1);
        }
      }, duration);
    })
    .catch(err => {
      console.warn("⚠️ loopPlayer.js: checkReadyAndPlay Promise.all error:", err);
    });
}

// Main playSegment (keeps your Promise.all pattern)
function playSegment(startTime, endTime, index = 0) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("❌ loopPlayer.js: Audio tracks not ready, retrying...");
    checkReadyAndPlay(startTime, endTime, index);
    return;
  }

  console.log(`🎵 Segment: ${startTime} -> ${endTime} (${endTime - startTime} seconds)`);

  // Cancel any previous segment playback & prevent overlap
  if (activeSegmentTimeout) {
    clearTimeout(activeSegmentTimeout);
    activeSegmentTimeout = null;
  }
  vocalAudio.pause();
  accompAudio.pause();

  // Set times
  try {
    vocalAudio.currentTime = startTime;
    accompAudio.currentTime = startTime;
  } catch (err) {
    console.warn("⚠️ Could not set currentTime in playSegment:", err);
  }

  // Ensure both play together
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .then(() => {
      currentlyPlaying = true;
      currentPlayingSegmentIndex = index;

      const duration = (endTime - startTime) * 1000;
      activeSegmentTimeout = setTimeout(() => {
        console.log("🔚 Segment ended.");
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;
        activeSegmentTimeout = null;
        currentPlayingSegmentIndex = null;

        // Auto-play next segment if present
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

  songNameDropdown.addEventListener("change", () => {
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

        // Clear existing buttons
        loopButtonsDiv.innerHTML = "";

        // Create segment buttons (retaining your 2nd-play workaround)
        loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;

          btn.addEventListener("click", () => {
            // If audio for selected song hasn't been loaded into vocalAudio/accompAudio, load now
            if (!vocalAudio.src || !accompAudio.src) {
              const songName = document.getElementById("songSelect").value;
              if (!songName) {
                console.warn("⚠️ No song selected.");
                return;
              }

              const vocalUrl = getDropboxFileURL(songName + "_vocal.mp3");
              const accUrl = getDropboxFileURL(songName + "_acc.mp3");

              console.log("🎧 Streaming vocal from:", vocalUrl);
              console.log("🎧 Streaming accompaniment from:", accUrl);

              // Set sources and request preload
              vocalAudio.src = vocalUrl;
              accompAudio.src = accUrl;
              vocalAudio.preload = "auto";
              accompAudio.preload = "auto";

              // Wait for both audio items to be ready before playing the segment
              waitForAudioReady(() => {
                // Now play the clicked segment
                playSegment(segment.start, segment.end, index);
              });

              // If your sluggishness workaround is needed, simulate an extra quick tap after a short delay
              // (keeps your original logic)
              setTimeout(() => {
                // Optional repeated play to remove sluggishness — keep if you saw benefit
                // Note: only do this if you actually need it; retained as per your file
                playSegment(segment.start, segment.end, index);
              }, 500);

            } else {
              // If audio already loaded, just play requested segment
              playSegment(segment.start, segment.end, index);
              // Simulate second tap as your workaround (retained)
              setTimeout(() => playSegment(segment.start, segment.end, index), 500);
            }
          });

          loopButtonsDiv.appendChild(btn);
        });

        // Notify segmentProgressVisualizer.js (unchanged)
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
