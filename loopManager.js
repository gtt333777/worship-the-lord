document.addEventListener("DOMContentLoaded", async () => {
    const songSelect = document.getElementById("songSelect");
    if (!songSelect) {
        console.warn("⚠️ songSelect not found");
        return;
    }

    songSelect.addEventListener("change", handleSongSelection);

    const segmentButtons = document.querySelectorAll("button[id^='segment']");
    segmentButtons.forEach(button => {
        button.addEventListener("click", () => {
            const segmentNumber = parseInt(button.id.replace("segment", ""));
            console.log(`🎵 User clicked Segment ${segmentNumber}`);
            playFromSegment(segmentNumber);
        });
    });

    console.log("✅ loopManager.js fully initialized.");
});

let loopData = [];
let currentSegmentIndex = 0;
let vocalAudio = null;
let accompAudio = null;

async function handleSongSelection() {
    const songName = document.getElementById("songSelect").value;
    console.log("🎶 New song selected:", songName);

    const prefix = getPrefixFromSongName(songName);
    if (!prefix) {
        console.error("❌ Could not derive prefix from song name");
        return;
    }

    const vocalUrl = await getDropboxUrl(`/WorshipSongs/${prefix}_vocal.mp3`);
    const accompUrl = await getDropboxUrl(`/WorshipSongs/${prefix}_acc.mp3`);
    const loopsUrl = await getDropboxUrl(`/WorshipSongs/${prefix}_loops.json`);

    console.log("🎤 Vocal URL:", vocalUrl);
    console.log("🎼 Accompaniment URL:", accompUrl);
    console.log("🔁 Loops JSON:", loopsUrl);

    try {
        vocalAudio = new Audio(vocalUrl);
        accompAudio = new Audio(accompUrl);

        vocalAudio.addEventListener("ended", stopPlayback);
        accompAudio.addEventListener("ended", stopPlayback);

        const response = await fetch(loopsUrl);
        loopData = await response.json();
        console.log("✅ Loaded loops:", loopData);
    } catch (err) {
        console.error("❌ Error loading audio files:", err);
    }
}

function playFromSegment(segmentNumber) {
    if (!loopData.length) {
        console.warn("⚠️ No loop data loaded");
        return;
    }

    const segment = loopData[segmentNumber - 1];
    if (!segment) {
        console.warn(`⚠️ Segment ${segmentNumber} not found`);
        return;
    }

    currentSegmentIndex = segmentNumber - 1;
    playSegment(currentSegmentIndex);
}

function playSegment(index) {
    const loop = loopData[index];
    if (!loop) return;

    const start = loop.start;
    const end = loop.end;

    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    vocalAudio.play();
    accompAudio.play();

    const interval = setInterval(() => {
        if (vocalAudio.currentTime >= end || accompAudio.currentTime >= end) {
            vocalAudio.pause();
            accompAudio.pause();
            clearInterval(interval);

            if (index + 1 < loopData.length) {
                playSegment(index + 1);
            } else {
                console.log("✅ Playback finished after last loop.");
            }
        }
    }, 100);
}

function stopPlayback() {
    vocalAudio.pause();
    accompAudio.pause();
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
}

function getPrefixFromSongName(songName) {
    // Assume suffix-based matching
    const suffixMap = {
        "என் வாழ்க்கையெல்லாம் உம்": "En_vaalkaikayellam_Um",
        "உம் நாமத்தையே தூதுவோம்": "Um_Namaththaiye_Thooduvoam",
        // Add more as needed
    };
    for (const [key, val] of Object.entries(suffixMap)) {
        if (songName.endsWith(key)) return val;
    }
    return null;
}

async function getDropboxUrl(path) {
    try {
        const response = await fetch("/.netlify/functions/getDropboxToken");  // ✅ FIXED URL
        const data = await response.json();
        const accessToken = data.access_token;

        return `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${accessToken}&arg={"path":"${path}"}`;
    } catch (err) {
        console.error("❌ getDropboxUrl error:", err);
        throw err;
    }
}
