// segmentProgressVisualizer.js (patched — zero flicker)
console.log("segmentProgressVisualizer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("segmentProgressVisualizer.js: DOMContentLoaded...");
});

function startSegmentProgressVisualizer(segments, vocalAudio, loopButtonsContainer) {
  console.log("segmentProgressVisualizer.js: startSegmentProgressVisualizer() called");

  if (!segments || !vocalAudio || !loopButtonsContainer) {
    console.warn("⚠️ segmentProgressVisualizer.js: Missing required items.");
    return;
  }

  const progressBars = [];

  segments.forEach((segment, i) => {
    const btn = loopButtonsContainer.children[i];
    if (!btn) return;

    // ensure button
    btn.classList.add("segment-button");

    // remove old bar
    const old = btn.querySelector(".progress-bar");
    if (old) old.remove();

    // create new bar
    const bar = document.createElement("div");
    bar.classList.add("progress-bar");

    // ⭐ ALWAYS visible, never opacity hidden
    bar.style.left = "-5px";

    btn.appendChild(bar);

    progressBars.push({
      bar,
      start: segment.start,
      end: segment.end
    });
  });

  function updateProgress() {
    const t = vocalAudio.currentTime;

    progressBars.forEach(pb => {
      const { bar, start, end } = pb;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;
        bar.style.left = pct + "%";
      } else {
        // old-style hide (no removal, no opacity)
        bar.style.left = "-5px";
      }
    });

    requestAnimationFrame(updateProgress);
  }

  requestAnimationFrame(updateProgress);
}
