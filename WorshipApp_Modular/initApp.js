// === App Initializer ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const songSelect = document.getElementById("songSelect");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const lyricsArea = document.getElementById("lyricsArea");

    if (!songSelect || !playBtn || !pauseBtn || !lyricsArea) {
      throw new Error("Missing essential DOM elements.");
    }

    // Play button
    playBtn.addEventListener("click", () => {
      vocalAudio.play();
      accompAudio.play();
    });

    // Pause button
    pauseBtn.addEventListener("click", () => {
      vocalAudio.pause();
      accompAudio.pause();
    });

    // Song selection handler
    songSelect.addEventListener("change", async () => {
      const tamilName = songSelect.value;
      if (!tamilName) return;

      // Load lyrics
      try {
        const res = await fetch(`lyrics/${tamilName}.txt`);
        const text = await res.text();
        lyricsArea.value = text;
        console.log("Lyrics updated for selected song.");
      } catch (err) {
        console.error("Lyrics load failed:", err);
      }

      // Build Dropbox path
      const prefix = encodeURIComponent(tamilName);
      const basePath = "/WorshipSongs/";
      const vocalPath = basePath + prefix + "_vocal.mp3";
      const accompPath = basePath + prefix + "_acc.mp3";

      // Fetch and stream MP3s
      try {
        const res = await fetch("/.netlify/functions/getDropboxToken");
        const data = await res.json();
        const token = data.access_token;

        const streamDropboxAudio = (audioEl, path) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://content.dropboxapi.com/2/files/download");
          xhr.setRequestHeader("Authorization", "Bearer " + token);
          xhr.setRequestHeader("Dropbox-API-Arg", JSON.stringify({ path }));
          xhr.responseType = "blob";
          xhr.onload = () => {
            audioEl.src = URL.createObjectURL(xhr.response);
            console.log("Audio loaded:", path);
          };
          xhr.onerror = () => {
            console.error("Audio failed to load:", path);
          };
          xhr.send();
        };

        streamDropboxAudio(vocalAudio, vocalPath);
        streamDropboxAudio(accompAudio, accompPath);
      } catch (err) {
        console.error("Audio setup failed:", err);
      }
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    alert("Something went wrong during app initialization.");
  }
});
