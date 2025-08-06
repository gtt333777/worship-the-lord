console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");

  let attempts = 0;
  const maxAttempts = 20;
  const interval = 500;

  function waitForElements() {
    attempts++;

    const container = document.getElementById("loopButtonsContainer");
    const vocalAudio = window.vocalAudio;

    if (!container || !vocalAudio) {
      console.log(
        `segmentProgressVisualizer.js: Waiting for vocalAudio or segments... (attempt ${attempts})`
      );
      if (attempts < maxAttempts) {
        setTimeout(waitForElements, interval);
      } else {
        console.warn("segmentProgressVisualizer.js: Gave up waiting for required elements.");
      }
      return;
    }

    console.log("segmentProgressVisualizer.js: Found vocalAudio and loopButtonsContainer.");
    setupProgressTracking(container, vocalAudio);
  }

  function setupProgressTracking(container, vocalAudio) {
    const buttons = container.querySelectorAll(".segment-button");
    if (buttons.length === 0) {
      console.warn("segmentProgressVisualizer.js: No segment buttons found.");
      return;
    }

    const segmentData = Array.from(buttons).map((btn, index) => ({
      element: btn,
      start: parseFloat(btn.getAttribute("data-start")),
      end: parseFloat(btn.getAttribute("data-end")),
      index,
    }));

    let currentProgressBar = null;
    let currentSegment = null;

    setInterval(() => {
      const time = vocalAudio.currentTime;

      const activeSegment = segmentData.find((seg) => time >= seg.start && time <= seg.end);

      if (!activeSegment) {
        if (currentProgressBar) {
          currentProgressBar.remove();
          currentProgressBar = null;
          currentSegment = null;
        }
        return;
      }

      if (currentSegment !== activeSegment) {
        // New segment started
        if (currentProgressBar) currentProgressBar.remove();

        currentProgressBar = document.createElement("div");
        currentProgressBar.className = "progress-bar";
        activeSegment.element.appendChild(currentProgressBar);
        currentSegment = activeSegment;
      }

      const duration = activeSegment.end - activeSegment.start;
      const elapsed = time - activeSegment.start;
      const percent = Math.min(1, Math.max(0, elapsed / duration));
      const buttonWidth = activeSegment.element.clientWidth;

      if (currentProgressBar) {
        currentProgressBar.style.left = `${Math.floor(buttonWidth * percent)}px`;
      }
    }, 100);
  }

  waitForElements();
});
