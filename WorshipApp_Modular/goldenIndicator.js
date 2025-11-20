console.log("GoldenIndicator.js: Loaded");

/*
  GLOBAL GOLDEN INDICATOR
  Vertical golden line on the left side of the active segment button.
  Updates smoothly based on audio.currentTime.
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

  // -------------------------------------------------------------
  // 1) Ensure every button has exactly ONE .segment-gold-line
  // -------------------------------------------------------------
  const buttons = container.querySelectorAll(".segment-button");
  if (!buttons.length) {
    console.warn("GoldenIndicator.js: No segment-button elements found");
    return;
  }

  const goldLines = [];

  buttons.forEach((btn, i) => {
    let line = btn.querySelector(".segment-gold-line");

    if (!line) {
      line = document.createElement("div");
      line.className = "segment-gold-line";
      btn.appendChild(line);
      console.log("GoldenIndicator: gold-line added to button", i + 1);
    }

    // Map segment range to this gold line
    const seg = segments[i];
    if (seg) {
      goldLines.push({
        line: line,
        start: seg.start,
        end: seg.end
      });
    }
  });

  // -------------------------------------------------------------
  // 2) Animation Loop — Updates the active gold-line smoothly
  // -------------------------------------------------------------
  function update() {
    const t = vocalAudio.currentTime;

    goldLines.forEach(g => {
      const { line, start, end } = g;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;
        line.style.height = pct + "%";
      } else {
        line.style.height = "0%";
      }
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};
