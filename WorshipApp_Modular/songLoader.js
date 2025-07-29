// songLoader.js

// Globals (shared audio elements — do NOT re-declare anywhere else)
let vocalAudio = new Audio();
let accompAudio = new Audio();

// This must be declared once and shared
window.vocalAudio = vocalAudio;
window.accompAudio = accompAudio;

// Song name to prefix mapping
const songMap = {
  "இயேசு ரத்தமே நத்தமே நத்தமே": "yesu_raththame",
  "உம்மை யாரும் ஓட்டமிட முடியாது": "ummai_yarum",
  // Add more as needed
};

// STREAM the selected song
async function streamSelectedSong(selectedTamilName) {
  const prefix = songMap[selectedTamilName];
  if (!prefix) {
    alert("Prefix not found for selected song!");
    return;
  }

  // Get the latest token from global (populated via tokenLoader.js)
  const ACCESS_TOKEN = window.ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    alert("Dropbox access token not available.");
    return;
  }

  // Helper to stream file from Dropbox
  async function streamFileToAudio(path, audioElement) {
    const response = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + ACCESS_TOKEN,
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to stream audio: ${response.statusText}`);
    }

    const blob = await response.blob();
    audioElement.src = URL.createObjectURL(blob);
    await audioElement.load();
  }

  try {
    const vocalPath = `/WorshipSongs/${prefix}_vocal.wav.mp3`;
    const accompPath = `/WorshipSongs/${prefix}_acc.wav.mp3`;

    await Promise.all([
      streamFileToAudio(vocalPath, vocalAudio),
      streamFileToAudio(accompPath, accompAudio),
    ]);

    console.log("Both audio tracks loaded successfully!");
  } catch (err) {
    console.error("Streaming error:", err);
    alert("Unable to load audio files. Please check Dropbox path or token.");
  }
}

// Make available to initApp.js
window.streamSelectedSong = streamSelectedSong;
