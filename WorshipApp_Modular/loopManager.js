// WorshipApp_Modular/loopManager.js

let loopData = [];
let currentLoopIndex = -1;
let isPlaying = false;
let loopTimeout = null;
let activeButton = null;

function loadLoopsFromDropbox(loopJsonUrl) {
    fetch(loopJsonUrl)
        .then(res => res.json())
        .then(data => {
            loopData = data.loops || [];
            renderLoopButtons(loopData);
        })
        .catch(err => console.error('Failed to load loop JSON:', err));
}

function renderLoopButtons(loops) {
    const container = document.getElementById("loopButtonsContainer");
    if (!container) {
        console.warn("⚠️ loopButtonsContainer not found during DOMContentLoaded.");
        return;
    }
    container.innerHTML = "";
    loops.forEach((loop, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.className = "loop-btn";
        btn.onclick = () => startLoopSegment(index);
        container.appendChild(btn);
    });
}

function startLoopSegment(index) {
    if (!loopData[index]) return;

    stopCurrentPlayback();

    const { start, end } = loopData[index];
    currentLoopIndex = index;

    if (vocalAudio && accompAudio) {
        vocalAudio.currentTime = start;
        accompAudio.currentTime = start;

        vocalAudio.play();
        accompAudio.play();
        isPlaying = true;

        highlightActiveButton(index);

        const duration = (end - start) * 1000;
        loopTimeout = setTimeout(() => {
            stopCurrentPlayback();
        }, duration);
    }
}

function stopCurrentPlayback() {
    if (isPlaying) {
        vocalAudio.pause();
        accompAudio.pause();
        isPlaying = false;
    }
    if (loopTimeout) {
        clearTimeout(loopTimeout);
        loopTimeout = null;
    }
    currentLoopIndex = -1;
    removeButtonHighlight();
}

function highlightActiveButton(index) {
    removeButtonHighlight();
    const container = document.getElementById("loopButtonsContainer");
    if (!container) return;
    const buttons = container.getElementsByTagName("button");
    if (buttons[index]) {
        buttons[index].style.backgroundColor = "#ffd966";
        activeButton = buttons[index];
    }
}

function removeButtonHighlight() {
    if (activeButton) {
        activeButton.style.backgroundColor = "";
        activeButton = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("loopButtonsContainer");
    if (!container) {
        console.warn("⚠️ loopButtonsContainer not found during DOMContentLoaded.");
    }
});
