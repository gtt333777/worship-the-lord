// segmentProgressVisualizer.js
console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");
});

/**
 * 🎵 startSegmentProgressVisualizer()
 * Smooth golden needle — no flicker, no disappear
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
      console.warn(`⚠️ No button for segment ${i}`);
      return;
    }

    try {
      btn.classList.add("segment-button");

      // Remove older bar
      const old = btn.querySelector(".progress-bar");
      if (old) old.remove();

      // Create new bar
      const bar = document.createElement("div");
      bar.classList.add("progress-bar");

      // ⭐ Start fully transparent but present in DOM
      bar.style.opacity = "0";
      bar.style.left = "0%";

      btn.appendChild(bar);

      progressBars.push({
        bar,
        start: segment.start,
        end: segment.end
      });
    } catch (e) {
      console.error(`❌ segmentProgressVisualizer.js: Error segment ${i}`, e);
    }
  });

  // ------------------------------------------------------
  //  SMOOTH UPDATE LOOP — never removes element → NO FLICKER
  // ------------------------------------------------------
  function updateProgress() {
    const t = vocalAudio.currentTime;
    let visibleFound = false;

    progressBars.forEach(pb => {
      const { bar, start, end } = pb;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;
        bar.style.left = pct + "%";

        // ⭐ Fade-in only when active
        bar.style.opacity = "1";
        visibleFound = true;
      } else {
        // ⭐ Fade-out but keep DOM alive (important!)
        bar.style.opacity = "0";
      }
    });

    requestAnimationFrame(updateProgress);
  }

  requestAnimationFrame(updateProgress);
}
