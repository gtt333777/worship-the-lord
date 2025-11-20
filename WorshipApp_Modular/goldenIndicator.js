/* ============================================================
   ⭐ Golden Indicator — Stable, Independent, Non-Flickering
   - Creates 1 gold bar per segment button
   - Animates width smoothly
   - Never duplicates bars
   - Never disappears when clicking first segment
   ============================================================ */

console.log("GoldenIndicator.js: Independent mode loaded");

window.startGoldenIndicator = function (segments, audio, container) {
    try {
        if (!segments || !audio || !container) {
            console.warn("GoldenIndicator: Missing data");
            return;
        }

        console.log("GoldenIndicator.js: startGoldenIndicator called");

        /* ----------------------------------------------------
           1️⃣ Remove old bars completely to avoid duplicates
        ---------------------------------------------------- */
        const oldBars = container.querySelectorAll(".gold-bar");
        oldBars.forEach(e => e.remove());

        /* ----------------------------------------------------
           2️⃣ Attach 1 fresh gold-bar to every segment button
        ---------------------------------------------------- */
        const buttons = container.querySelectorAll(".segment-button");
        buttons.forEach(btn => {
            const bar = document.createElement("div");
            bar.className = "gold-bar";
            bar.style.width = "0%";     // JST animation target
            btn.appendChild(bar);
        });

        /* ----------------------------------------------------
           3️⃣ Animation loop — smooth and flicker-free
        ---------------------------------------------------- */
        function animateGoldenBar() {
            const current = audio.currentTime;
            let activeIndex = -1;

            for (let i = 0; i < segments.length; i++) {
                if (current >= segments[i].start && current <= segments[i].end) {
                    activeIndex = i;
                    break;
                }
            }

            buttons.forEach((btn, index) => {
                const bar = btn.querySelector(".gold-bar");
                if (!bar) return;

                if (index === activeIndex) {
                    const seg = segments[index];
                    const percent = ((current - seg.start) / (seg.end - seg.start)) * 100;
                    bar.style.width = Math.max(0, Math.min(100, percent)) + "%";
                } else {
                    bar.style.width = "0%";
                }
            });

            requestAnimationFrame(animateGoldenBar);
        }

        requestAnimationFrame(animateGoldenBar);

    } catch (err) {
        console.error("GoldenIndicator ERROR:", err);
    }
};
