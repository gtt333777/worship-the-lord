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





        // Auto-play Segment 1 after audio is ready
const tryStartSegment1 = () => {
  if (vocalAudio.readyState >= 2 && accompAudio.readyState >= 2) {
    console.log("🎯 Auto-starting Segment 1");
    const seg = segments[0];
    playSegment(seg.start, seg.end, 0);
  } else {
    console.log("⏳ Audio not ready yet, retrying Segment 1 auto-play...");
    setTimeout(tryStartSegment1, 100);
  }
};

// Start auto-play
tryStartSegment1();









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
          loopData.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.className = "segment-button";
          btn.textContent = `Segment ${index + 1}`;

          btn.addEventListener("click", () => {


          const isReady = vocalAudio?.readyState >= 2 && accompAudio?.readyState >= 2;
  if (!isReady) {
    console.warn("⏳ Audio not ready yet, retrying with checkReadyAndPlay...");
    checkReadyAndPlay(segment.start, segment.end, index);
  } else {




        // Simulate 3 quick taps to remove vocal sluggishness
          playSegment(segment.start, segment.end, index);
          //setTimeout(() => playSegment(segment.start, segment.end, index), 100);
          //setTimeout(() => playSegment(segment.start, segment.end, index), 140);
          //setTimeout(() => playSegment(segment.start, segment.end, index), 210);
         
          // Extra: If this is Segment 1 and first time tapped, simulate a second tap
         /*
          if (index === 0 && !window.segment1TappedOnce) {
           window.segment1TappedOnce = true; // mark first tap happened
           // First simulated tap after 300ms
           setTimeout(() => {
             console.log("🎯 Simulating second tap on Segment 1 for sync");
             playSegment(segment.start, segment.end, index);
           }, 150); // adjustable delay (300ms)

          
                    
                      
          // Second simulated tap after 600ms (300ms after the previous one)
             setTimeout(() => {
             console.log("🎯 Simulating third tap on Segment 1 for perfect sync");
             playSegment(segment.start, segment.end, index);
             }, 300);
          
         */
          }
         
          

         });

         loopButtonsDiv.appendChild(btn);
            
         });

         
         
         /*
         // After buttons are created, simulate a delayed manual tap on first segment
         setTimeout(() => {
         if (loopData.length > 0) {
         console.log("🎯 Simulating manual tap on Segment 1");
         playSegment(loopData[0].start, loopData[0].end, 0);
         }
       }, 450); // delay can be tuned: 500ms, 1000ms, etc.

       */


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
