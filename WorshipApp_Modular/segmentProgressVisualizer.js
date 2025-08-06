// segmentProgressVisualizer.js
console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");
});

let animationFrameId = null;

function startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsContainer) {
  console.log("segmentProgressVisualizer.js: startSegmentProgressVisualizer() called");

  if (!segments || !vocalAudio || !loopButtonsContainer) {
    console.warn("❌ Missing inputs to startSegmentProgressVisualizer");
    return;
  }

  // Remove any existing progress bars (if reloaded)
  const existingBars = loopButtonsContainer.querySelectorAll(".progress-bar");
  existingBars.forEach(bar => bar.remove());

  // Add progress bars to each segment button
  const segmentButtons = loopButtonsContainer.querySelectorAll(".segment-button");
  segmentButtons.forEach((button, i) => {
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.left = "0%";
    bar.style.display = "none"; // Initially hidden
    button.appendChild(bar);
  });

  // Function to update progress bar inside the current segment
  function updateProgress() {
    const currentTime = vocalAudio.currentTime;

    segments.forEach((segment, i) => {
      const button = segmentButtons[i];
      const bar = button.querySelector(".progress-bar");

      const start = segment.start;
      const end = segment.end;

      if (currentTime >= start && currentTime <= end) {
        const progressPercent = ((currentTime - start) / (end - start)) * 100;
        bar.style.left = `${progressPercent}%`;
        bar.style.display = "block";
      } else {
        bar.style.display = "none";
      }
    });

    animationFrameId = requestAnimationFrame(updateProgress);
  }

  // Start animation
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  updateProgress();
}

// Make it globally callable
window.startSegmentProgressVisualizer = startSegmentProgressVisualizer;
