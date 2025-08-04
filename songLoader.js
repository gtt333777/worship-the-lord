let currentLoops = [];
let selectedPrefix = "";

// ✅ Add this to render segment buttons in loopManager.html
function renderLoopButtons(loopsData) {
    const container = document.getElementById("loopButtonsContainer");
    container.innerHTML = "";

    loopsData.forEach((loop, index) => {
        const button = document.createElement("button");
        button.innerText = `Segment ${index + 1}`;
        button.className = "loop-button";
        button.onclick = () => {
            if (window.vocalAudio && window.accompAudio) {
                vocalAudio.currentTime = loop.start;
                accompAudio.currentTime = loop.start;

                const endTime = loop.end;
                vocalAudio.play();
                accompAudio.play();

                const stopPlayback = () => {
                    if (vocalAudio.currentTime >= endTime || accompAudio.currentTime >= endTime) {
                        vocalAudio.pause();
                        accompAudio.pause();
                        clearInterval(loopCheck);
                    }
                };
                const loopCheck = setInterval(stopPlayback, 200);
            }
        };
        container.appendChild(button);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const songSelect = document.getElementById("songSelect");
    const lyricsTextArea = document.getElementById("lyricsTextArea");

    if (!songSelect || !lyricsTextArea) {
        console.error("songLoader.js: #songSelect or #lyricsTextArea not found");
        return;
    }

    songSelect.addEventListener("change", async () => {
        const selectedSongName = songSelect.value.trim();
        if (!selectedSongName) return;

        console.log("songLoader.js: Song selected -", selectedSongName);

        const songLines = window.songNameLines || [];
        const matchedIndex = songLines.findIndex(line => selectedSongName.includes(line.trim()));
        if (matchedIndex === -1) {
            console.warn("songLoader.js: Song name not found in songs_names.txt");
            return;
        }

        selectedPrefix = `song${matchedIndex + 1}`;

        // 🔤 Load lyrics
        fetch(`lyrics/${selectedPrefix}.txt`)
            .then(response => response.text())
            .then(text => {
                lyricsTextArea.value = text;
            })
            .catch(err => {
                lyricsTextArea.value = "Lyrics not found.";
                console.error("songLoader.js: Failed to load lyrics file:", err);
            });

        // 🔁 Load loops
        const loopFile = `${selectedPrefix}_loops.json`;
        const loopUrl = `https://www.dropbox.com/scl/fi/xxxxx/${loopFile}?rlkey=yyyyy&dl=1`; // Replace with your working loop folder
        try {
            const loopResp = await fetch(loopUrl);
            if (!loopResp.ok) throw new Error("Loop JSON fetch failed");
            const loopJson = await loopResp.json();
            currentLoops = loopJson;
            renderLoopButtons(currentLoops); // ✅ Show Segment buttons
        } catch (err) {
            currentLoops = [];
            document.getElementById("loopButtonsContainer").innerHTML = "";
            console.warn("songLoader.js: Could not load loop JSON file", err);
        }

        // 🎵 Load audio files
        const tokenResp = await fetch("/.netlify/functions/token");
        const { access_token } = await tokenResp.json();

        const vocalPath = `/WorshipSongs/${selectedPrefix}_vocal.mp3`;
        const accompPath = `/WorshipSongs/${selectedPrefix}_acc.mp3`;

        const getLink = async (path) => {
            const resp = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ path })
            });
            const data = await resp.json();
            return data.link;
        };

        try {
            const vocalUrl = await getLink(vocalPath);
            const accompUrl = await getLink(accompPath);
            window.vocalAudio = new Audio(vocalUrl);
            window.accompAudio = new Audio(accompUrl);
        } catch (err) {
            console.error("songLoader.js: Audio file loading failed", err);
        }
    });
});
