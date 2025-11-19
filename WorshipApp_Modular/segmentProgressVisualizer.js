// segmentProgressVisualizer.js
console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");
});

/**
 * 🎵 startSegmentProgressVisualizer()
 * Creates and updates ONE visible green/gold vertical bar
 * that moves only on the currently active segment.
 */
function startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsContainer) {
  console.log("segmentProgressVisualizer.js: startSegmentProgressVisualizer() called");

  if (!segments || !vocalAudio || !loopButtonsContainer) {
    console.warn("⚠️ segmentProgressVisualizer.js: Missing segments, vocalAudio, or loopButtonsContainer.");
    return;
  }

  const progressBars = [];

  segments.forEach((segment, i) => {
    const btn = loopButtonsContainer.children[i];
    if (!btn) {
      console.warn(`⚠️ segmentProgressVisualizer.js: No button found for segment ${i}`);
      return;
    }

    try {
      btn.classList.add("segment-button");

      // Remove any old progress bar if already present
      const existingBar = btn.querySelector(".progress-bar");
      if (existingBar) existingBar.remove();

      // Create and append new progress bar
      const progressBar = document.createElement("div");
      progressBar.classList.add("progress-bar");

      // ⭐ Use opacity instead of display to avoid flicker
      progressBar.style.opacity = "0";

      btn.appendChild(progressBar);

      progressBars.push({
        bar: progressBar,
        start: segment.start,
        end: segment.end
      });
    } catch (e) {
      console.error(`❌ segmentProgressVisualizer.js: Error processing segment ${i}`, e);
    }
  });

  // ✅ Update progress bar in real-time — show only one active
  function updateProgress() {
    const currentTime = vocalAudio.currentTime;
    let activeFound = false;

    progressBars.forEach(pb => {
      const { bar, start, end } = pb;

      if (currentTime >= start && currentTime <= end) {
        const percent = ((currentTime - start) / (end - start)) * 100;
        bar.style.left = `${percent}%`;

        // ⭐ Smooth fade-in
        bar.style.opacity = "1";

        activeFound = true;
      } else {
        // ⭐ Smooth fade-out instead of display:none (NO flicker)
        bar.style.opacity = "0";
      }
    });

    requestAnimationFrame(updateProgress);
  }

  requestAnimationFrame(updateProgress);
}
