// ✅ segmentProgressVisualizer.js
console.log("segmentProgressVisualizer.js: Starting...");

function startSegmentProgressVisualizer(segmentData, vocalAudio) {
    console.log("segmentProgressVisualizer.js: DOMContentLoaded...");

    document.addEventListener("DOMContentLoaded", () => {
        console.log("segmentProgressVisualizer.js: Waiting for vocalAudio or segments...");

        const loopButtonsContainer = document.getElementById("loopButtonsContainer");
        if (!loopButtonsContainer) {
            console.warn("segmentProgressVisualizer.js: No segment buttons container found.");
            return;
        }

        const segmentButtons = loopButtonsContainer.querySelectorAll(".segment-button");
        if (!segmentButtons.length) {
            console.warn("segmentProgressVisualizer.js: No segment buttons found.");
            return;
        }

        // Remove existing progress bars
        document.querySelectorAll(".progress-bar").forEach(bar => bar.remove());

        segmentButtons.forEach((button, index) => {
            const bar = document.createElement("div");
            bar.className = "progress-bar";
            bar.style.left = "0px";
            button.appendChild(bar);
        });

        let animationFrameId;

        function updateProgressBar() {
            const currentTime = vocalAudio.currentTime;

            segmentData.forEach((segment, index) => {
                const { start, end } = segment;
                const duration = end - start;
                const elapsed = currentTime - start;
                const progressPercent = (elapsed / duration) * 100;

                const button = segmentButtons[index];
                const bar = button?.querySelector(".progress-bar");

                if (bar) {
                    if (elapsed >= 0 && elapsed <= duration) {
                        bar.style.left = `${progressPercent}%`;
                        bar.style.display = "block";
                    } else {
                        bar.style.left = "0%";
                        bar.style.display = "none";
                    }
                }
            });

            animationFrameId = requestAnimationFrame(updateProgressBar);
        }

        updateProgressBar();
    });
}
