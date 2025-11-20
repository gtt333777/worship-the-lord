console.log("GoldenIndicator.js: Loaded");

/*
  GLOBAL GOLDEN INDICATOR
  Vertical golden line on the left side of the active segment button.
  Updates smoothly based on audio currentTime.
*/

window.startGoldenIndicator = function (segments, vocalAudio, container) {
  console.log("GoldenIndicator.js: startGoldenIndicator called");

  if (!segments || !segments.length) {
    console.warn("GoldenIndicator.js: No segments provided");
    return;
  }
  if (!vocalAudio) {
    console.warn("GoldenIndicator.js: vocalAudio missing");
    return;
  }
  if (!container) {
    console.warn("GoldenIndicator.js: container missing");
    return;
  }

  // Remove all previous gold lines
  document.querySelectorAll(".segment-gold-line").forEach(el => el.remove());

  const buttons = container.querySelectorAll(".segment-button");
  if (!buttons.length) {
    console.warn("GoldenIndicator.js: No segment-button elements found");
    return;
  }

  // Create gold lines for each segment
  const goldLines = [];
  segments.forEach((seg, i) => {
    const btn = buttons[i];
    if (!btn) return;

    const line = document.createElement("div");
    line.className = "segment-gold-line";
    btn.appendChild(line);

    goldLines.push({
      line: line,
      start: seg.start,
      end: seg.end
    });
  });

  // Update loop
  function update() {
    const t = vocalAudio.currentTime;

    goldLines.forEach((g, i) => {
      const { line, start, end } = g;

      if (t >= start && t <= end) {
        // Segment active
        const pct = ((t - start) / (end - start)) * 100;
        line.style.height = pct + "%";
      } else {
        // Hide for inactive segments
        line.style.height = "0%";
      }
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};
