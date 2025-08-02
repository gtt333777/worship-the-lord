// 🎵 Global playback functions
function playAudio() {
    console.log("▶️ Play button clicked");
    if (window.vocalAudio && window.accompAudio) {
        vocalAudio.play();
        accompAudio.play();
    } else {
        console.warn("⚠️ Audio elements not available.");
    }
}

function pauseAudio() {
    console.log("⏸️ Pause button clicked");
    if (window.vocalAudio && window.accompAudio) {
        vocalAudio.pause();
        accompAudio.pause();
    } else {
        console.warn("⚠️ Audio elements not available.");
    }
}

// ✅ Setup event listeners AFTER DOM is ready
function initializeAudioControls() {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (playBtn && pauseBtn) {
        playBtn.addEventListener('click', playAudio);
        pauseBtn.addEventListener('click', pauseAudio);
        console.log("✅ Audio control buttons initialized.");
    } else {
        console.warn("⚠️ Audio control buttons NOT found in DOM.");
    }
}
