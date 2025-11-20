// ================================
// 🎵 GoldenIndicator.js (Independent Mode)
// Same architecture as segmentProgressVisualizer.js
// ================================
console.log("GoldenIndicator.js: Independent mode loaded");

// Called by loopPlayer.js AFTER buttons are created
function startGoldenIndicator(segments, vocalAudio, loopButtonsContainer) {
    console.log("GoldenIndicator.js: startGoldenIndicator called");

    if (!segments || !vocalAudio || !loopButtonsContainer) {
        console.warn("⚠️ GoldenIndicator: Missing inputs.");
        return;
    }

    const bars = [];

    // Build underline bar for each segment button
    segments.forEach((seg, i) => {
        const btn = loopButtonsContainer.children[i];
        if (!btn) {
            console.warn("⚠️ GoldenIndicator: No button for segment", i);
            return;
        }

        // Remove old bar if exists
        const old = btn.querySelector(".gold-bar");
        if (old) old.remove();

        // Create new underline bar
        const bar = document.createElement("div");
        bar.className = "gold-bar";
        bar.style.width = "0%";
        btn.appendChild(bar);

        bars.push({ bar, start: seg.start, end: seg.end });
    });

    // Live update loop (like segmentProgressVisualizer)
    function update() {
        const t = vocalAudio.currentTime;
        let active = false;

        bars.forEach(entry => {
            const { bar, start, end } = entry;

            if (t >= start && t <= end) {
                active = true;
                const pct = ((t - start) / (end - start)) * 100;
                bar.style.width = pct + "%";
            } else {
                bar.style.width = "0%"; // reset others
            }
        });

        if (!active) {
            bars.forEach(entry => entry.bar.style.width = "0%");
        }

        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}
