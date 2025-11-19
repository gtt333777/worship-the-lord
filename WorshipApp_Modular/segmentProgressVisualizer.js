console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");
});

/**
 * 🎵 startSegmentProgressVisualizer()
 * Smooth, non-flickering segment progress bar
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
      console.warn(`⚠️ No button found for segment ${i}`);
      return;
    }

    try {
      btn.classList.add("segment-button");

      // Remove any old progress bar
      const old = btn.querySelector(".progress-bar");
      if (old) old.remove();

      // Create progress bar
      const bar = document.createElement("div");
      bar.classList.add("progress-bar");

      // ⭐ NO FLICKER FIX — never use display:none
      bar.style.opacity = "0";         // hidden but present
      bar.style.transform = "translateX(0%)";

      btn.appendChild(bar);

      progressBars.push({
        bar,
        start: segment.start,
        end: segment.end
      });

    } catch (e) {
      console.error(`❌ Error processing segment ${i}`, e);
    }
  });

  // Smooth update
  function updateProgress() {
    const t = vocalAudio.currentTime;
    let active = false;

    progressBars.forEach(pb => {
      const { bar, start, end } = pb;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;

        // ⭐ GPU Smooth positioning
        bar.style.transform = `translateX(${pct}%)`;

        bar.style.opacity = "1";  // visible
        active = true;
      } else {
        // keep it in layout, just fade
        bar.style.opacity = "0";
      }
    });

    requestAnimationFrame(updateProgress);
  }

  requestAnimationFrame(updateProgress);
}
