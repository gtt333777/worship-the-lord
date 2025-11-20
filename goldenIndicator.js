console.log("GoldenIndicator.js: Loaded");

/*
  GLOBAL GOLDEN INDICATOR (Bottom Underline)
  Creates a gold underline below the active segment button.
  Underline expands from 0% → 100% based on audio progress.
*/

window.startGoldenIndicator = function (segments, vocalAudio, container) {
  console.log("GoldenIndicator.js: startGoldenIndicator called");

  if (!segments || !segments.length) return console.warn("GoldenIndicator: No segments");
  if (!vocalAudio) return console.warn("GoldenIndicator: vocalAudio missing");
  if (!container) return console.warn("GoldenIndicator: container missing");

  const buttons = container.querySelectorAll(".segment-button");
  if (!buttons.length) return console.warn("GoldenIndicator: No segment buttons found");

  const goldLines = [];

  buttons.forEach((btn, i) => {
    let line = btn.querySelector(".segment-gold-line");

    if (!line) {
      line = document.createElement("div");
      line.className = "segment-gold-line";

      // ⭐ Bottom underline styling applied by JS
      Object.assign(line.style, {
        position: "absolute",
        left: "0",
        bottom: "-4px",          // underline position
        height: "4px",
        width: "0%",             // start empty
        backgroundColor: "gold",
        borderRadius: "2px",
        transition: "width 0.08s linear",
        pointerEvents: "none",
      });

      btn.style.position = "relative";
      btn.appendChild(line);
    }

    const seg = segments[i];
    if (seg) {
      goldLines.push({
        line,
        start: seg.start,
        end: seg.end
      });
    }
  });

  // -------------------------------
  // Animation Loop
  // -------------------------------
  function update() {
    const t = vocalAudio.currentTime;

    goldLines.forEach(g => {
      const { line, start, end } = g;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;
        line.style.width = pct + "%";   // underline expands
        line.style.opacity = "1";
      } else {
        line.style.width = "0%";
        line.style.opacity = "0.25";    // faint when not active
      }
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};
