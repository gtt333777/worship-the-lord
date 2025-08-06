// segmentProgressVisualizer.js
console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");
});

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

      // Remove old progress bar if already present
      const existingBar = btn.querySelector(".progress-bar");
      if (existingBar) existingBar.remove();

      // Create and append new progress bar
      const progressBar = document.createElement("div");
      progressBar.classList.add("progress-bar");
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

  function updateProgress() {
    const currentTime = vocalAudio.currentTime;

    progressBars.forEach(pb => {
      const { bar, start, end } = pb;
      if (currentTime < start || currentTime > end) {
        bar.style.left = "-5px";
        return;
      }

      const percent = ((currentTime - start) / (end - start)) * 100;
      bar.style.left = `${percent}%`;
    });

    requestAnimationFrame(updateProgress);
  }

  requestAnimationFrame(updateProgress);
}
