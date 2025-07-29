// songLoader.js

let vocalAudio = new Audio();
let accompAudio = new Audio();

// 🔄 Stream one song at a time — this clears previous src and plays only selected
function streamSelectedSong(tamilName) {
  const slug = encodeURIComponent(tamilName);

  vocalAudio.pause();
  accompAudio.pause();

  vocalAudio.src = "";
  accompAudio.src = "";

  // Get new token each time
  fetch("/.netlify/functions/getDropboxToken")
    .then(res => res.json())
    .then(data => {
      const token = data.access_token;
      const pathVocal = `/WorshipSongs/${slug}_vocal.wav.mp3`;
      const pathAcc = `/WorshipSongs/${slug}_acc.wav.mp3`;

      // Fetch audio blob and set src
      const fetchBlob = (path, audioEl) => {
        fetch("https://content.dropboxapi.com/2/files/download", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Dropbox-API-Arg": JSON.stringify({ path })
          }
        })
          .then(res => {
            if (!res.ok) throw new Error("Download failed");
            return res.blob();
          })
          .then(blob => {
            audioEl.src = URL.createObjectURL(blob);
            audioEl.load();
            console.log("Audio loaded:", path);
          })
          .catch(err => console.error("Failed to stream audio:", err));
      };

      fetchBlob(pathVocal, vocalAudio);
      fetchBlob(pathAcc, accompAudio);
    })
    .catch(err => {
      console.error("Error fetching token or audio:", err);
      alert("Something went wrong while loading the song.");
    });
}

// ⏯️ Unified play/pause
document.getElementById("playBtn").addEventListener("click", async () => {
  try {
    await vocalAudio.play();
    await accompAudio.play();
  } catch (e) {
    console.error("Playback failed:", e);
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

// 🔊 Volume control
["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("input", e => {
    const vol = parseFloat(e.target.value);
    if (type === "vocal") vocalAudio.volume = vol;
    else accompAudio.volume = vol;
  });
});

// ⬆️ Make it available globally
window.streamSelectedSong = streamSelectedSong;
window.vocalAudio = vocalAudio;
window.accompAudio = accompAudio;
