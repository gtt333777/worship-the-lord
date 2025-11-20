// ===============================================================
// goldenIndicator.js — Vertical Golden Line for Active Segment
// ===============================================================

console.log("GoldenIndicator.js: Loaded");

window.startGoldenIndicator = function (segments, vocalAudio, container) {
  console.log("GoldenIndicator.js: startGoldenIndicator called");

  if (!segments || !vocalAudio || !container) {
    console.warn("GoldenIndicator.js: Missing inputs.");
    return;
  }

  // Remove old indicators if any
  container.querySelectorAll(".golden-line").forEach(el => el.remove());

  const indicators = [];

  // Create 1 golden line DIV per segment
  segments.forEach((segment, i) => {
    const btn = container.children[i];
    if (!btn) return;

    const line = document.createElement("div");
    line.className = "golden-line";

    // initial hidden state
    line.style.opacity = "0";
    line.style.transform = "scaleY(0)";

    // attach
    btn.style.position = "relative";
    btn.appendChild(line);

    indicators.push({
      line,
      start: segment.start,
      end: segment.end
    });
  });

  // Animation loop
  function update() {
    const t = vocalAudio.currentTime;

    indicators.forEach((ind, index) => {
      const { line, start, end } = ind;

      if (t >= start && t <= end) {
        const pct = (t - start) / (end - start);
        line.style.opacity = "1";
        line.style.transform = `scaleY(${pct})`;
      } else {
        line.style.opacity = "0";
        line.style.transform = "scaleY(0)";
      }
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};

// ===============================================================
// Inject required CSS (auto-inserted)
// ===============================================================

(function addGoldenLineCSS() {
  if (document.getElementById("golden-line-style")) return;

  const css = `
    .golden-line {
      position: absolute;
      left: 0px;
      top: 3px;
      bottom: 3px;
      width: 4px;
      background: linear-gradient(to bottom, #FFD700, #FFC300);
      border-radius: 4px;
      transform-origin: top;
      transition: opacity 0.20s linear;
      pointer-events: none;
    }
  `;

  const style = document.createElement("style");
  style.id = "golden-line-style";
  style.textContent = css;
  document.head.appendChild(style);
})();
