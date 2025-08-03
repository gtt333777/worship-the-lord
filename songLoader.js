// 📜 Song loading logic
function loadSelectedSong() {
    const songList = document.getElementById('songList');
    const selectedIndex = songList.selectedIndex;
    const selectedName = songList.options[selectedIndex].text;

    console.log(`🎼 Selected song: ${selectedName}`);

    // Load lyrics
    fetch(`lyrics/${selectedName}.txt`)
        .then(response => {
            if (!response.ok) throw new Error("Lyrics file not found");
            return response.text();
        })
        .then(lyrics => {
            document.getElementById('lyricsDisplay').value = lyrics;
            console.log("📖 Lyrics loaded successfully.");
        })
        .catch(error => {
            console.error("❌ Error loading lyrics:", error);
            document.getElementById('lyricsDisplay').value = "Lyrics not available.";
        });

    // Load audio
    const prefix = selectedName;
    const vocalUrl = `https://content.dropboxapi.com/apitl/1/XXX/${prefix}_vocal.mp3`;
    const accUrl = `https://content.dropboxapi.com/apitl/1/XXX/${prefix}_acc.mp3`;

    window.vocalAudio = new Audio(vocalUrl);
    window.accompAudio = new Audio(accUrl);

    console.log("🎧 Audio sources prepared (not yet played).");
}

// ✅ Setup event listener AFTER DOM is ready
function initializeSongLoader() {
    const songList = document.getElementById('songList');

    if (songList) {
        songList.addEventListener('change', loadSelectedSong);
        console.log("✅ Song loader initialized.");
    } else {
        console.warn("⚠️ songList element NOT found in DOM.");
    }
}
