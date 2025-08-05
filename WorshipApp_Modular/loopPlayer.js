console.log("🔁 loopPlayer.js: Starting...");

let loops = [];
let currentLoopIndex = 0;
let loopPlaybackActive = false;

// Wait until vocalAudio, accompAudio, and currentSongName are defined
function waitForGlobals() {
    if (!window.vocalAudio || !window.accompAudio || !window.currentSongName) {
        console.warn("🔁 loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName...");
        setTimeout(waitForGlobals, 300); // wait again
        return;
    }

    console.log("🔁 loopPlayer.js: Globals are ready. Setting up loop player.");
    fetchLoopData(window.currentSongName);
}

function fetchLoopData(songName) {
    const slug = songName.trim(); // same name used for MP3
    const loopsUrl = `https://content.dropboxapi.com/2/files/download`;
    const accessToken = window.dropboxAccessToken;

    const dropboxPath = `/WorshipSongs/${slug}_loops.json`;

    fetch(loopsUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({ path: dropboxPath })
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to fetch loops JSON");
        return res.json();
    })
    .then(data => {
        loops = data;
        if (loops.length > 0) {
            console.log(`🔁 loopPlayer.js: Loaded ${loops.length} loops.`);
            createLoopButtons();
        } else {
            console.warn("🔁 No loops found.");
        }
    })
    .catch(err => {
        console.error("❌ loopPlayer.js: Error fetching loops JSON:", err);
    });
}

function createLoopButtons() {
    const container = document.createElement("div");
    container.id = "loopButtonsContainer";
    container.style.margin = "10px";
    document.body.appendChild(container);

    loops.forEach((loop, index) => {
        const btn = document.createElement("button");
        btn.textContent = `🔁 ${index + 1}`;
        btn.style.margin = "3px";
        btn.onclick = () => startLoopSequence(index);
        container.appendChild(btn);
    });

    console.log("🔁 Loop buttons created.");
}

function startLoopSequence(startIndex) {
    if (!loops[startIndex]) return;

    currentLoopIndex = startIndex;
    loopPlaybackActive = true;

    playNextLoopSegment();
}

function playNextLoopSegment() {
    if (!loopPlaybackActive || currentLoopIndex >= loops.length) {
        console.log("🔁 Loop playback finished.");
        loopPlaybackActive = false;
        return;
    }

    const loop = loops[currentLoopIndex];
    const { start, end } = loop;

    window.vocalAudio.currentTime = start;
    window.accompAudio.currentTime = start;

    window.vocalAudio.play();
    window.accompAudio.play();

    const duration = (end - start) * 1000;

    setTimeout(() => {
        currentLoopIndex++;
        playNextLoopSegment();
    }, duration);
}

// Start once DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("🔁 loopPlayer.js: DOMContentLoaded – waiting for audio to be initialized.");
    waitForGlobals();
});
