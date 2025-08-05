// loopPlayer.js
console.log("loopPlayer.js: Starting...");

document.addEventListener('DOMContentLoaded', () => {
  console.log("loopPlayer.js: DOMContentLoaded – checking for global readiness...");

  const checkGlobalsReady = () => {
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;
    const currentSongName = window.currentSongName;

    console.log("🔍 Global Check:");
    console.log(" - window.vocalAudio:", vocalAudio);
    console.log(" - window.accompAudio:", accompAudio);
    console.log(" - window.currentSongName:", currentSongName);

    if (!vocalAudio || !accompAudio || !currentSongName) {
      console.warn("loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName... (attempt " + (checkGlobalsReady.attempts + 1) + ")");
      checkGlobalsReady.attempts++;
      if (checkGlobalsReady.attempts < 15) {
        setTimeout(checkGlobalsReady, 400); // Retry after delay
      } else {
        console.error("loopPlayer.js: ❌ Failed to find required global variables.");
      }
      return;
    }

    console.log("✅ loopPlayer.js: All globals ready.");

    const prefix = getPrefixForTamilName(currentSongName);
    if (!prefix) {
      console.warn("loopPlayer.js: ⚠️ Could not derive prefix for song:", currentSongName);
      return;
    }

    const loopFilePath = `lyrics/${prefix}_loops.json`;
    console.log(`📁 Looking for loops file: ${loopFilePath}`);

    fetch(loopFilePath)
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then(loopData => {
        console.log("✅ Parsed Loop Data:", loopData);

        if (!Array.isArray(loopData) || loopData.length === 0) {
          console.warn("loopPlayer.js: ❌ Invalid or empty loopData.");
          return;
        }

        const container = document.getElementById("loopButtonsContainer");
        if (!container) {
          console.warn("loopPlayer.js: ❌ loopButtonsContainer not found in DOM.");
          return;
        }

        container.innerHTML = ''; // Clear existing buttons

        loopData.forEach((segment, index) => {
          const btn = document.createElement('button');
          btn.textContent = `Segment ${index + 1}`;
          btn.style.marginRight = "8px";
          btn.addEventListener("click", () => {
            console.log(`▶️ Playing Segment ${index + 1}: ${segment.start}s to ${segment.end}s`);
            playSegmentFrom(vocalAudio, accompAudio, loopData, index);
          });
          container.appendChild(btn);
        });

        console.log("✅ Segment buttons created.");

      })
      .catch(err => {
        console.error("loopPlayer.js: ❌ Error loading loops JSON:", err.message);
      });
  };

  checkGlobalsReady.attempts = 0;
  checkGlobalsReady();
});

function getPrefixForTamilName(songName) {
  const tamilToPrefix = {
    "என் வாழ்க்கையெல்லாம் உம்": "envaazhkaiyellaamum",
    "ஐயா உம் திரு நாமம்": "aiyaaumthirunaamam",
    "இயேசு ரத்தமே ரத்தமே ரத்தமே": "iyesuraththame"
    // Add more mappings here as needed
  };

  return tamilToPrefix[songName] || null;
}

function playSegmentFrom(vocalAudio, accompAudio, loopData, startIndex) {
  let currentIndex = startIndex;

  function playNextSegment() {
    if (currentIndex >= loopData.length) {
      console.log("✅ Finished all segments.");
      vocalAudio.pause();
      accompAudio.pause();
      return;
    }

    const segment = loopData[currentIndex];
    vocalAudio.currentTime = segment.start;
    accompAudio.currentTime = segment.start;

    vocalAudio.play();
    accompAudio.play();

    const segmentEndTime = segment.end;
    const checkInterval = setInterval(() => {
      if (vocalAudio.currentTime >= segmentEndTime || accompAudio.currentTime >= segmentEndTime) {
        clearInterval(checkInterval);
        currentIndex++;
        playNextSegment(); // Play next segment
      }
    }, 200);
  }

  playNextSegment();
}
