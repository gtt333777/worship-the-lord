console.log("GoldenIndicator.js: Loaded (Underline Mode)");

/*
   GOLD UNDERLINE INDICATOR
   --------------------------------
   • Adds one .segment-gold-bar below each segment button
   • Bar grows LEFT → RIGHT during that segment
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

  const buttons = container.querySelectorAll(".segment-button");
  if (!buttons.length) {
    console.warn("GoldenIndicator.js: No segment-button elements found");
    return;
  }

  const bars = [];

  // -------------------------------------------------------------
  // 1) Create underline bar for each segment button
  // -------------------------------------------------------------
  buttons.forEach((btn, i) => {
    let bar = btn.querySelector(".segment-gold-bar");

    if (!bar) {
      bar = document.createElement("div");
      bar.className = "segment-gold-bar";   // underline bar
      btn.appendChild(bar);
      console.log("GoldenIndicator: gold-bar added to button", i + 1);
    }

    const seg = segments[i];
    if (seg) {
      bars.push({
        bar,
        start: seg.start,
        end: seg.end
      });
    }
  });

  // -------------------------------------------------------------
  // 2) Animation Loop — update underline width
  // -------------------------------------------------------------
  function update() {
    const t = vocalAudio.currentTime;

    bars.forEach(b => {
      const { bar, start, end } = b;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;
        bar.style.width = pct + "%";
      } else {
        bar.style.width = "0%";   // reset for inactive segments
      }
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};
