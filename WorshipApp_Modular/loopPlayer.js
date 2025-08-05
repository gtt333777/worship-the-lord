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
      console.warn(`loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName... (attempt ${checkGlobalsReady.attempts + 1})`);
      checkGlobalsReady.attempts++;
      if (checkGlobalsReady.attempts < 15) {
        setTimeout(checkGlobalsReady, 400); // Retry
      } else {
        console.error("loopPlayer.js: ❌ Failed to find required global variables.");
      }
      return;
    }

    console.log("✅ loopPlayer.js: All globals ready!");

    // STEP 1: Build filename
    const loopFile = `lyrics/${currentSongName}_loops.json`;

    // STEP 2: Fetch the JSON
    fetch(loopFile)
      .then(response => {
        if (!response.ok) throw new Error("File not found");
        return response.json();
      })
      .then(data => {
        console.log("✅ Parsed loops:", data);

        const container = document.getElementById("loopButtonsContainer");
        if (!container) {
          console.warn("❗ loopButtonsContainer not found in DOM.");
          return;
        }

        container.innerHTML = ''; // Clear old buttons

        data.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.textContent = `Segment ${index + 1}`;
          btn.style.margin = "5px";
          btn.onclick = () => {
            console.log(`▶️ Playing segment ${index + 1}: ${segment.start} → ${segment.end}`);
            vocalAudio.currentTime = segment.start;
            accompAudio.currentTime = segment.start;
            vocalAudio.play();
            accompAudio.play();

            const stopAt = segment.end;
            const checkStop = () => {
              if (vocalAudio.currentTime >= stopAt || accompAudio.currentTime >= stopAt) {
                vocalAudio.pause();
                accompAudio.pause();
              } else {
                requestAnimationFrame(checkStop);
              }
            };
            requestAnimationFrame(checkStop);
          };

          container.appendChild(btn);
        });
      })
      .catch(err => {
        console.warn(`⚠️ No loop file found for ${currentSongName}`);
      });
  };

  checkGlobalsReady.attempts = 0;
  checkGlobalsReady();
});
