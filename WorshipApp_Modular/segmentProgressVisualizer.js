console.log("segmentProgressVisualizer.js: Starting...");

function startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsContainer) {
  console.log("startSegmentProgressVisualizer() called");

  if (!segments || !Array.isArray(segments)) {
    console.error("❌ segmentProgressVisualizer.js: segments is not an array!", segments);
    return;
  }

  if (!loopButtonsContainer || !vocalAudio) {
    console.error("❌ segmentProgressVisualizer.js: Missing required parameters.");
    return;
  }

  // Add class and inject .progress-bar into each segment button
  const progressBars = [];

  segments.forEach((segment, i) => {
    const btn = loopButtonsContainer.children[i];
    if (!btn) return;

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
  });

  // Animation loop
  function updateProgress() {
    const currentTime = vocalAudio.currentTime;

    progressBars.forEach(({ bar, start, end }) => {
      if (currentTime >= start && currentTime <= end) {
        const percent = (currentTime - start) / (end - start);
        bar.style.left = `${percent * 100}%`;
      } else {
        bar.style.left = `-5%`; // Hide outside loop
      }
    });

    requestAnimationFrame(updateProgress);
  }

  requestAnimationFrame(updateProgress);
}
