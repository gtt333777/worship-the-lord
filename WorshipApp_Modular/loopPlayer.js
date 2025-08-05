console.log("🔁 loopPlayer.js: Starting...");

let loops = [];
let currentLoopIndex = 0;
let loopPlaybackActive = false;

function waitForGlobals(maxAttempts = 20, delay = 500) {
    let attempts = 0;

    const check = () => {
        if (window.vocalAudio && window.accompAudio && window.currentSongName && window.dropboxAccessToken) {
            console.log("🔁 loopPlayer.js: All globals are ready.");
            fetchLoopData(window.currentSongName);
        } else {
            attempts++;
            if (attempts < maxAttempts) {
                console.warn(`🔁 loopPlayer.js: Waiting for vocalAudio, accompAudio or currentSongName... (attempt ${attempts})`);
                setTimeout(check, delay);
            } else {
                console.error("🔁 loopPlayer.js: Gave up waiting for global variables.");
            }
        }
    };

    check();
}

function fetchLoopData(songName) {
    const slug = songName.trim();
    const accessToken = window.dropboxAccessToken;
    const dropboxPath = `/WorshipSongs/${slug}_loops.json`;

    fetch("https://content.dropboxapi.com/2/files/download", {
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
            console.warn("🔁 No loops found in JSON.");
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

    console.log("🔁 loopPlayer.js: Loop buttons rendered.");
}

function startLoopSequence(startIndex) {
    if (!loops[startIndex]) return;

    currentLoopIndex = startIndex;
    loopPlaybackActive = true;
    playNextLoopSegment();
}

function playNextLoopSegment() {
    if (!loopPlaybackActive || currentLoopIndex >= loops.length) {
        console.log("🔁 loopPlayer.js: Finished playing all loops.");
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

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔁 loopPlayer.js: DOMContentLoaded – checking for global readiness...");
    waitForGlobals();
});
