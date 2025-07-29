// === App Initializer ===
document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const lyricsArea = document.getElementById("lyricsArea");

  if (!songSelect || !playBtn || !pauseBtn || !lyricsArea) {
    alert("Something went wrong during app initialization.");
    console.error("Initialization failed: Missing DOM elements");
    return;
  }

  playBtn.addEventListener("click", () => {
    if (vocalAudio && accompAudio) {
      vocalAudio.play();
      accompAudio.play();
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (vocalAudio && accompAudio) {
      vocalAudio.pause();
      accompAudio.pause();
    }
  });

  songSelect.addEventListener("change", async () => {
    const tamilName = songSelect.value;
    if (!tamilName) return;

    // === Load Lyrics ===
    try {
      const res = await fetch(`lyrics/${tamilName}.txt`);
      const text = await res.text();
      lyricsArea.value = text;
      console.log("Lyrics loaded successfully!");
    } catch (err) {
      console.error("Error loading lyrics:", err);
    }

    // === Load Dropbox Token ===
    try {
      const tokenRes = await fetch("/.netlify/functions/getDropboxToken");
      const { access_token } = await tokenRes.json();
      if (!access_token) throw new Error("No access token received.");
      console.log("Dropbox token loaded successfully!");

      // === Load Audio Files ===
      const prefix = encodeURIComponent(tamilName);
      const basePath = "/WorshipSongs/";

      const setDropboxAudio = (audio, path) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://content.dropboxapi.com/2/files/download");
        xhr.setRequestHeader("Authorization", "Bearer " + access_token);
        xhr.setRequestHeader("Dropbox-API-Arg", JSON.stringify({ path }));
        xhr.responseType = "blob";

        xhr.onload = () => {
          const blobUrl = URL.createObjectURL(xhr.response);
          audio.src = blobUrl;
          console.log(`Audio loaded: ${path}`);
        };

        xhr.onerror = () => {
          console.error(`Failed to load audio: ${path}`);
        };

        xhr.send();
      };

      setDropboxAudio(vocalAudio, basePath + prefix + "_vocal.mp3");
      setDropboxAudio(accompAudio, basePath + prefix + "_acc.mp3");

    } catch (err) {
      console.error("Dropbox audio loading failed:", err);
    }
  });
});
