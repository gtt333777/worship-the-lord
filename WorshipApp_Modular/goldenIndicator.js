// ================================================================
//  GoldenIndicator.js — Totally Independent Version
//  - Does NOT modify buttons
//  - Does NOT need dataset.start/dataset.end
//  - Reads timings from window.loadedSegments
//  - Smooth underline animation for only the active segment
// ================================================================

console.log("GoldenIndicator.js: Independent mode loaded");

(function () {
    if (window.__goldenIndependentLoaded) return;
    window.__goldenIndependentLoaded = true;

    function addBars() {
        const btns = document.querySelectorAll(".segment-button");
        if (!btns.length) return false;

        btns.forEach((btn, i) => {
            if (!btn.querySelector(".segment-gold-bar")) {
                const bar = document.createElement("div");
                bar.className = "segment-gold-bar";
                btn.appendChild(bar);
            }
        });
        return true;
    }

    function animate() {
        requestAnimationFrame(animate);

        const audio = window.vocalAudio;
        const segs = window.loadedSegments;
        const buttons = document.querySelectorAll(".segment-button");
        if (!audio || !segs || !buttons.length) return;

        const now = audio.currentTime;

        buttons.forEach((btn, i) => {
            const bar = btn.querySelector(".segment-gold-bar");
            if (!bar) return;

            const seg = segs[i];
            if (!seg) return;

            if (now >= seg.start && now <= seg.end) {
                // inside this segment → grow underline
                const progress = (now - seg.start) / (seg.end - seg.start);
                bar.style.width = (progress * 100) + "%";
            } else {
                // outside segment → reset underline
                bar.style.width = "0%";
            }
        });
    }

    // Start after buttons appear
    const observer = new MutationObserver(() => {
        if (addBars()) observer.disconnect();
    });
    observer.observe(document.body, { subtree: true, childList: true });

    animate();
})();
