// segmentProgressVisualizer.js
console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");

  let retryCount = 0;
  const maxRetries = 20;
  const retryDelay = 300;

  const waitForGlobals = () => {
    const vocalAudio = window.vocalAudio;
    const segments = window.segmentsData;
    const buttons = document.querySelectorAll(".segment-button");

    if (!vocalAudio || !segments || buttons.length === 0) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`segmentProgressVisualizer.js: Waiting for vocalAudio or segments... (attempt ${retryCount})`);
        setTimeout(waitForGlobals, retryDelay);
      } else {
        console.warn("segmentProgressVisualizer.js: Gave up waiting for required elements.");
      }
      return;
    }

    console.log("segmentProgressVisualizer.js: All globals and buttons ready! ✅");
    startProgressLoop();
  };

  waitForGlobals();
});

function startProgressLoop() {
  let previousIndex = -1;
  let animationFrame;

  function updateProgress() {
    const vocalAudio = window.vocalAudio;
    const currentIndex = window.currentSegmentIndex;
    const segments = window.segmentsData;

    if (
      !vocalAudio ||
      !segments ||
      currentIndex === undefined ||
      currentIndex === -1 ||
      !segments[currentIndex]
    ) {
      requestAnimationFrame(updateProgress);
      return;
    }

    const segment = segments[currentIndex];
    const button = document.querySelector(`.segment-button[data-index='${currentIndex}']`);
    if (!button) {
      requestAnimationFrame(updateProgress);
      return;
    }

    // Remove any old progress bars from other buttons
    if (previousIndex !== currentIndex) {
      document.querySelectorAll(".progress-bar").forEach(bar => bar.remove());
    }

    let progressBar = button.querySelector(".progress-bar");
    if (!progressBar) {
      progressBar = document.createElement("div");
      progressBar.classList.add("progress-bar");
      button.appendChild(progressBar);
    }

    // Calculate progress % within current segment
    const duration = segment.end - segment.start;
    const elapsed = vocalAudio.currentTime - segment.start;
    const percent = Math.min(Math.max(elapsed / duration, 0), 1) * 100;

    progressBar.style.left = `${percent}%`;

    previousIndex = currentIndex;
    animationFrame = requestAnimationFrame(updateProgress);
  }

  animationFrame = requestAnimationFrame(updateProgress);
}
