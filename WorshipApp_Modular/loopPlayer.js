// ✅ GOLD STANDARD BASE + VERTICAL PROGRESS BAR FOR CURRENT SEGMENT

console.log("loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
    checkReady(0);
});

function checkReady(attempts) {
    const songSelect = document.getElementById("songSelect");
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;

    if (!songSelect || !vocalAudio || !accompAudio) {
        if (attempts < 20) {
            console.log(`loopPlayer.js: Waiting for vocalAudio, accompAudio or songSelect... (attempt ${attempts})`);
            setTimeout(() => checkReady(attempts + 1), 300);
        } else {
            console.error("loopPlayer.js: ❌ Required global variables not found");
        }
        return;
    }

    const selectedTamilName = songSelect.value;
    const loopsFilename = `lyrics/${selectedTamilName}_loops.json`;
    console.log("🎯 loopPlayer.js: Using selected song name for test", selectedTamilName);
    console.log("📂 Trying to fetch loop file:", loopsFilename);

    fetch(loopsFilename)
        .then(response => {
            if (!response.ok) throw new Error("Loop file fetch failed");
            return response.json();
        })
        .then(loopData => {
            console.log("✅ Loop data loaded:", loopData);
            createSegmentButtons(loopData);
        })
        .catch(err => {
            console.warn("⚠️ No loop file found for this song.", err);
        });
}

let segmentTimeout;
let currentlyPlaying = false;

function createSegmentButtons(loopData) {
    const container = document.getElementById("loopButtonsContainer");
    container.innerHTML = "";

    loopData.forEach((seg, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.classList.add("segment-button");

        const progressBar = document.createElement("div");
        progressBar.classList.add("segment-progress");
        progressBar.style.width = "0%";
        progressBar.style.height = "4px";
        progressBar.style.backgroundColor = "green";
        progressBar.style.marginTop = "2px";
        progressBar.style.transition = "width 0.1s linear";
        progressBar.style.display = "none";

        btn.appendChild(progressBar);

        btn.addEventListener("click", () => {
            if (!window.vocalAudio || !window.accompAudio) return;

            // Stop existing
            clearTimeout(segmentTimeout);
            window.vocalAudio.pause();
            window.accompAudio.pause();
            currentlyPlaying = false;

            window.vocalAudio.currentTime = seg.start;
            window.accompAudio.currentTime = seg.start;

            // Reset all other progress bars
            const allProgress = document.querySelectorAll(".segment-progress");
            allProgress.forEach(bar => {
                bar.style.width = "0%";
                bar.style.display = "none";
            });

            // Show only current progress bar
            progressBar.style.display = "block";

            window.vocalAudio.play();
            window.accompAudio.play();
            currentlyPlaying = true;

            const duration = seg.end - seg.start;

            segmentTimeout = setTimeout(() => {
                window.vocalAudio.pause();
                window.accompAudio.pause();
                currentlyPlaying = false;
                progressBar.style.display = "none";
            }, duration * 1000);

            // Visual progress bar update
            let lastUpdateTime = Date.now();
            const interval = setInterval(() => {
                if (!currentlyPlaying) return clearInterval(interval);
                const elapsed = window.vocalAudio.currentTime - seg.start;
                const progressPercent = (elapsed / duration) * 100;
                progressBar.style.width = `${Math.min(progressPercent, 100)}%`;

                // Stop interval once done
                if (elapsed >= duration) {
                    clearInterval(interval);
                    progressBar.style.display = "none";
                }
            }, 100);

            console.log(`▶️ Segment ${index + 1}: ${seg.start} ▶ ${seg.end} (${duration.toFixed(2)}s)`);
        });

        container.appendChild(btn);
    });
}
