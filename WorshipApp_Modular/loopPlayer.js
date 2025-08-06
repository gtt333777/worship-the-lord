console.log("🔁 loopPlayer.js: Ready...");

document.addEventListener("DOMContentLoaded", () => {
  const songDropdown = document.getElementById("songSelect");
  const vocalAudio = document.getElementById("vocalAudio");
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");

  let segments = [];
  let currentTimeout = null; // 🎯 Added to hold active timeout

  songDropdown.addEventListener("change", async () => {
    const tamilName = songDropdown.value;
    console.log("🎵 loopPlayer.js: Song selected →", tamilName);

    const loopFileName = `lyrics/${tamilName}_loops.json`;
    console.log("📂 Trying to fetch loop file:", loopFileName);

    try {
      const response = await fetch(loopFileName);
      if (!response.ok) throw new Error("Loop file not found");

      segments = await response.json();
      console.log("✅ Loop data loaded:", segments);

      loopButtonsContainer.innerHTML = "";
      segments.forEach((segment, index) => {
        const btn = document.createElement("button");
        btn.className = "segment-button";
        btn.textContent = `Segment ${index + 1}`;
        btn.addEventListener("click", () => {
          clearTimeout(currentTimeout); // ✅ Clear previous timer
          playSegment(segment.start, segment.end, index);
        });
        loopButtonsContainer.appendChild(btn);
      });

      // ✅ Notify segmentProgressVisualizer
      if (typeof startSegmentProgressVisualizer === "function") {
        startSegmentProgressVisualizer(segments, vocalAudio);
      }
    } catch (err) {
      console.warn("⚠️ No loop data found or failed to parse.");
      loopButtonsContainer.innerHTML = "";
    }
  });

  function playSegment(start, end, index) {
    vocalAudio.currentTime = start;
    vocalAudio.play();

    console.log(`🎯 Segment: ${start} ▶️ ${end} (${(end - start).toFixed(2)}s)`);

    clearTimeout(currentTimeout); // ✅ Clear any pending timer
    currentTimeout = setTimeout(() => {
      vocalAudio.pause();

      // ✅ Auto-play next segment (if exists)
      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        playSegment(nextSegment.start, nextSegment.end, index + 1);
      }
    }, (end - start) * 1000);
  }
});
