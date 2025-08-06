// WorshipApp_Modular/loopPlayer.js
console.log("🔁 loopPlayer.js: Ready...");

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("songSelect");
  const container = document.getElementById("loopButtonsContainer");

  let segments = [];
  let currentIndex = -1;
  let segmentEndTimeout = null;

  window.playSegment = function(start, end, index) {
    console.log(`🎯 Segment: ${start} ▶️ ${end} (${(end - start).toFixed(2)}s)`);

    if (segmentEndTimeout) clearTimeout(segmentEndTimeout);

    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.currentTime = start;
      window.accompAudio.currentTime = start;

      window.vocalAudio.play();
      window.accompAudio.play();

      currentIndex = index;

      segmentEndTimeout = setTimeout(() => {
        checkReadyAndPlay(index, segments);
      }, (end - start) * 1000);
    }
  };

  function checkReadyAndPlay(index, segments) {
    if (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      playSegment(nextSegment.start, nextSegment.end, index + 1);
    } else {
      console.log("✅ Finished last segment.");
      currentIndex = -1;
    }
  }

  async function fetchLoopData(songName) {
    const loopFile = `lyrics/${songName}_loops.json`;
    console.log("📂 Trying to fetch loop file:", loopFile);

    try {
      const response = await fetch(loopFile);
      if (!response.ok) throw new Error("Loop file not found");
      const data = await response.json();
      console.log("✅ Loop data loaded:", data);
      return data;
    } catch (e) {
      console.warn("⚠️ No loop data found.");
      return [];
    }
  }

  async function createLoopButtons(songName) {
    segments = await fetchLoopData(songName);
    container.innerHTML = "";

    if (segments.length === 0) return;

    segments.forEach((segment, index) => {
      const button = document.createElement("button");
      button.className = "segment-button";
      button.textContent = `Segment ${index + 1}`;

      // For progress plugin
      button.dataset.start = segment.start;
      button.dataset.end = segment.end;
      button.dataset.index = index;

      button.addEventListener("click", () => {
        if (segmentEndTimeout) clearTimeout(segmentEndTimeout);

        if (window.vocalAudio && window.accompAudio) {
          window.vocalAudio.pause();
          window.accompAudio.pause();
        }

        playSegment(segment.start, segment.end, index);
      });

      container.appendChild(button);
    });

    // ✅ Notify segmentProgressVisualizer.js only after buttons are created
    if (typeof startSegmentProgressVisualizer === "function") {
      startSegmentProgressVisualizer(segments, window.vocalAudio);
    }

    // ✅ Auto-start from segment 1
    playSegment(segments[0].start, segments[0].end, 0);
  }

  select.addEventListener("change", () => {
    const songName = select.value.trim();
    console.log("🎵 loopPlayer.js: Song selected →", songName);
    createLoopButtons(songName);
  });

  // Initial trigger
  if (select && select.value) {
    console.log("🎵 loopPlayer.js: Initial load →", select.value);
    createLoopButtons(select.value.trim());
  }
});
