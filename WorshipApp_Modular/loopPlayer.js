// WorshipApp_Modular/loopPlayer.js
console.log("loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("loopPlayer.js: DOMContentLoaded – checking for global readiness...");

  const checkGlobalsReady = () => {
    console.log("🔍 Global Check:");
    console.log(" - window.vocalAudio:", window.vocalAudio);
    console.log(" - window.accompAudio:", window.accompAudio);
    console.log(" - window.currentSongName:", window.currentSongName);

    if (!window.vocalAudio || !window.accompAudio || !window.currentSongName) {
      console.warn(`loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName... (attempt ${checkGlobalsReady.attempts + 1})`);
      checkGlobalsReady.attempts++;
      if (checkGlobalsReady.attempts < 20) {
        setTimeout(checkGlobalsReady, 500);
      } else {
        console.error("loopPlayer.js: ❌ Failed to find required global variables");
      }
      return;
    }

    console.log("✅ loopPlayer.js: All globals ready!");
    loadLoopData(window.currentSongName);
  };

  checkGlobalsReady.attempts = 0;
  checkGlobalsReady();
});

function loadLoopData(songName) {
  const jsonFile = `lyrics/${songName}_loops.json`;
  console.log(`📄 Fetching loop data from: ${jsonFile}`);

  fetch(jsonFile)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`loopPlayer.js: ❌ JSON not found: ${jsonFile}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("✅ Loop JSON loaded:", data);
      renderSegmentButtons(data);
    })
    .catch((err) => {
      console.warn("⚠️ loopPlayer.js:", err.message);
    });
}

function renderSegmentButtons(segments) {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = ""; // Clear old buttons

  if (!Array.isArray(segments) || segments.length === 0) {
    console.warn("loopPlayer.js: No segments found.");
    return;
  }

  segments.forEach((seg, index) => {
    const btn = document.createElement("button");
    btn.textContent = `🔁 Segment ${index + 1}`;
    btn.style.margin = "5px";
    btn.onclick = () => {
      playSegment(seg.start, seg.end);
    };
    container.appendChild(btn);
  });

  console.log(`✅ Rendered ${segments.length} segment buttons.`);
}

function playSegment(startTime, endTime) {
  console.log(`🎧 Playing segment: ${startTime}s to ${endTime}s`);
  const v = window.vocalAudio;
  const a = window.accompAudio;

  v.currentTime = a.currentTime = startTime;
  v.play();
  a.play();

  const stopAt = () => {
    if (v.currentTime >= endTime || a.currentTime >= endTime) {
      v.pause();
      a.pause();
      console.log("⏹️ Segment playback stopped.");
    } else {
      requestAnimationFrame(stopAt);
    }
  };

  stopAt();
}
