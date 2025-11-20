console.log("GoldenIndicator.js: Loaded (Underline Mode)");

/*
   GOLD UNDERLINE INDICATOR (FINAL WORKING VERSION)
   -----------------------------------------------
   • Underline sits INSIDE each button
   • Grows left → right during active segment
   • Safe even if styles override
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
  // 1) Create underline for each button (inside the button)
  // -------------------------------------------------------------
  buttons.forEach((btn, i) => {

    // ⭐ FORCE RELATIVE — required for underline to show correctly
    btn.style.position = "relative";
    btn.style.overflow = "visible";

    // Remove any old underline (double-load protection)
    btn.querySelectorAll(".segment-gold-bar").forEach(x => x.remove());

    let bar = document.createElement("div");
    bar.className = "segment-gold-bar";

    // ⭐ FORCE POSITIONING INLINE
    bar.style.position = "absolute";
    bar.style.left = "0";
    bar.style.bottom = "0";      // underline INSIDE the button
    bar.style.width = "0%";
    bar.style.height = "4px";
    bar.style.backgroundColor = "gold";
    bar.style.borderRadius = "2px";
    bar.style.pointerEvents = "none";
    bar.style.transition = "width 0.12s linear";

    btn.appendChild(bar);

    console.log("GoldenIndicator: gold-bar added to button", i + 1);

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
  // 2) Animation Loop — updates underline width
  // -------------------------------------------------------------
  function update() {
    const t = vocalAudio.currentTime;

    bars.forEach(b => {
      const { bar, start, end } = b;

      if (t >= start && t <= end) {
        const pct = ((t - start) / (end - start)) * 100;
        bar.style.width = pct + "%";
      } else {
        bar.style.width = "0%";
      }
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};
