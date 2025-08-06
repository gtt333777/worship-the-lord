// 🔁 loopPlayer.js: Ready...

let activeSegmentTimeouts = []; // 🧠 Track all segment timers

function clearAllSegmentTimers() {
  activeSegmentTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  activeSegmentTimeouts = [];
}

document.addEventListener("DOMContentLoaded", function () {
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");
  const songDropdown = document.getElementById("songSelect");
  const pauseButton = document.getElementById("pauseButton");

  const vocalAudio = document.getElementById("vocalAudio");
  const accompAudio = document.getElementById("accompAudio");

  let segments = [];

  pauseButton.addEventListener("click", function () {
    vocalAudio.pause();
    accompAudio.pause();
    clearAllSegmentTimers(); // 🧼 Cancel any queued next segment
  });

  songDropdown.addEventListener("change", function () {
    const selectedSong = songDropdown.value;
    console.log("🎵 loopPlayer.js: Song selected →", selectedSong);

    const loopFileName = `lyrics/${selectedSong}_loops.json`;
    console.log("📂 Trying to fetch loop file:", loopFileName);

    fetch(loopFileName)
      .then((response) => response.json())
      .then((data) => {
        segments = data;
        console.log("✅ Loop data loaded:", segments);
        renderSegmentButtons();
      })
      .catch((error) => {
        console.error("❌ Error loading loop file:", error);
        segments = [];
        loopButtonsContainer.innerHTML = "<p>No segments found for this song.</p>";
      });
  });

  function renderSegmentButtons() {
    loopButtonsContainer.innerHTML = ""; // Clear previous buttons

    segments.forEach((segment, index) => {
      const btn = document.createElement("button");
      btn.className = "segment-button";
      btn.textContent = `${index + 1}`;
      btn.style.padding = "10px";
      btn.style.border = "1px solid #999";
      btn.style.borderRadius = "6px";
      btn.style.cursor = "pointer";
      btn.style.position = "relative";

      // Create vertical progress bar inside button
      const progressBar = document.createElement("div");
      progressBar.className = "progress-bar";
      progressBar.style.left = "0";
      btn.appendChild(progressBar);

      btn.addEventListener("click", () => {
        playSegment(segment.start, segment.end, index);
      });

      loopButtonsContainer.appendChild(btn);
    });

    // ✅ Notify segmentProgressVisualizer.js
    if (typeof startSegmentProgressVisualizer === "function") {
      startSegmentProgressVisualizer(segments, vocalAudio);
    }
  }

  function playSegment(start, end, index) {
    clearAllSegmentTimers(); // ✅ Stop old transitions
    vocalAudio.pause();
    accompAudio.pause();

    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    const timeoutId = setTimeout(() => {
      checkReadyAndPlay();
    }, 100);
    activeSegmentTimeouts.push(timeoutId);

    function checkReadyAndPlay() {
      if (vocalAudio.readyState >= 2 && accompAudio.readyState >= 2) {
        vocalAudio.play();
        accompAudio.play();

        console.log(`🎯 Segment: ${start} ▶️ ${end} (${(end - start).toFixed(2)}s)`);

        const segmentDuration = (end - start) * 1000;
        const endTimeout = setTimeout(() => {
          vocalAudio.pause();
          accompAudio.pause();
          if (index < segments.length - 1) {
            const nextSegment = segments[index + 1];
            playSegment(nextSegment.start, nextSegment.end, index + 1);
          }
        }, segmentDuration);
        activeSegmentTimeouts.push(endTimeout);
      } else {
        const retryId = setTimeout(() => {
          checkReadyAndPlay();
        }, 100);
        activeSegmentTimeouts.push(retryId);
      }
    }
  }
});
