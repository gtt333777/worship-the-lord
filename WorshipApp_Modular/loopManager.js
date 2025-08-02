let loopsData = [];
let activeLoop = null;
let loopButtonsContainer = null;
let activeButton = null;

// 🔁 Create loop buttons based on loaded loop segments
function createLoopButtons() {
    if (!loopButtonsContainer) {
        console.warn("loopButtonsContainer is missing, cannot render buttons.");
        return;
    }
    loopButtonsContainer.innerHTML = ''; // Clear existing buttons

    loopsData.forEach((loop, index) => {
        const button = document.createElement('button');
        button.textContent = `Segment ${index + 1}`;
        button.classList.add('loop-button');
        button.addEventListener('click', () => {
            playLoopSegment(index, button);
        });
        loopButtonsContainer.appendChild(button);
    });
}

// 🔁 Play the selected loop segment, stop any previously active one
function playLoopSegment(index, button) {
    const loop = loopsData[index];
    if (!loop || !vocalAudio || !accompAudio) return;

    // Stop current playback
    vocalAudio.pause();
    accompAudio.pause();
    vocalAudio.currentTime = loop.start;
    accompAudio.currentTime = loop.start;

    // Highlight the active button
    removeButtonHighlight();
    activeButton = button;
    button.style.backgroundColor = '#eef';

    // Set active loop
    activeLoop = loop;

    vocalAudio.play();
    accompAudio.play();
}

// ⛔ Remove highlight from previous active button
function removeButtonHighlight() {
    if (activeButton) {
        activeButton.style.backgroundColor = '';
        activeButton = null;
    }
}

// 🕒 Check if playback goes beyond loop end
function monitorLoopPlayback() {
    if (!activeLoop || !vocalAudio || !accompAudio) return;

    const currentTime = Math.max(vocalAudio.currentTime, accompAudio.currentTime);
    if (currentTime >= activeLoop.end) {
        vocalAudio.pause();
        accompAudio.pause();
        removeButtonHighlight();
        activeLoop = null;
    }
}

// 🔄 Load loop data for selected song
function loadLoopsForSong(songName) {
    const filename = songName + '_loops.json';
    const url = `https://dl.dropboxusercontent.com/scl/fi/your-folder/${filename}?rlkey=your-key&raw=1`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch loops');
            return res.json();
        })
        .then(data => {
            loopsData = data;
            createLoopButtons();
            console.log(`Loaded ${loopsData.length} loop segments for ${songName}`);
        })
        .catch(err => {
            console.error('Error loading loops:', err);
            loopsData = [];
            loopButtonsContainer.innerHTML = '<p style="color:red;">No loop segments found</p>';
        });
}

// 🎧 Hook into song change
function onSongSelected(songName) {
    const suffix = '_vocal'; // Matching by suffix now
    const baseName = songName.endsWith(suffix) ? songName.slice(0, -suffix.length) : songName;
    loadLoopsForSong(baseName);
}

// ⏱ Loop monitor interval
setInterval(monitorLoopPlayback, 300);

// 🔁 Initialize loop button container once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loopButtonsContainer = document.getElementById('loopButtonsContainer');
    if (!loopButtonsContainer) {
        console.warn("⚠️ loopButtonsContainer not found during DOMContentLoaded.");
    }
});
