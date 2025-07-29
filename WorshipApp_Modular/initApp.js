// === App Initializer ===
document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  if (!songSelect || !playBtn || !pauseBtn) {
    console.error("Missing critical DOM elements.");
    alert("Something went wrong during app initialization.");
    return;
  }

  // ✅ Safely handle play/pause if audio objects are defined
  playBtn.addEventListener("click", () => {
    if (vocalAudio && accompAudio) {
      vocalAudio.play();
      accompAudio.play();
    } else {
      console.warn("Audio objects not initialized.");
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (vocalAudio && accompAudio) {
      vocalAudio.pause();
      accompAudio.pause();
    } else {
      console.warn("Audio objects not initialized.");
    }
  });

  songSelect.addEventListener("change", () => {
    const tamilName = songSelect.value;
    if (!tamilName) return;

    // Load lyrics
    fetch(`lyrics/${tamilName}.txt`)
      .then(res => res.text())
      .then(text => {
        document.getElementById("lyricsArea").value = text;
        console.log("Lyrics updated for selected song.");
      })
      .catch(err => console.error("Error loading lyrics:", err));

    // Construct audio URLs using ACCESS_TOKEN
    const prefix = encodeURIComponent(tamilName);
    const basePath = "/WorshipSongs/";

    fetch("/.netlify/functions/getDropboxToken")
      .then((res) => res.json())
      .then((data) => {
        if (!data.access_token) throw new Error("Token missing");
        const token = data.access_token;

        const setAudioSource = (audio, dropboxPath) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://content.dropboxapi.com/2/files/download");
          xhr.setRequestHeader("Authorization", "Bearer " + token);
          xhr.setRequestHeader("Dropbox-API-Arg", JSON.stringify({ path: dropboxPath }));
          xhr.responseType = "blob";
          xhr.onload = () => {
            const blobUrl = URL.createObjectURL(xhr.response);
            audio.src = blobUrl;
            console.log(`Audio loaded: ${dropboxPath}`);
          };
          xhr.onerror = () => console.error(`Failed to load audio: ${dropboxPath}`);
          xhr.send();
        };

        setAudioSource(vocalAudio, basePath + prefix + "_vocal.mp3");
        setAudioSource(accompAudio, basePath + prefix + "_acc.mp3");
      })
      .catch((err) => console.error("Audio token fetch failed:", err));
  });
});
