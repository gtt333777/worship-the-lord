// === App Initializer ===
document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const lyricsArea = document.getElementById("lyricsArea");

  if (!songSelect || !playBtn || !pauseBtn || !lyricsArea) {
    alert("Something went wrong during app initialization.");
    console.error("Missing critical DOM elements.");
    return;
  }

  // Play and Pause buttons
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

  // Song change event
  songSelect.addEventListener("change", () => {
    const tamilName = songSelect.value;
    if (!tamilName) return;

    // Load lyrics
    fetch(`lyrics/${tamilName}.txt`)
      .then(res => res.text())
      .then(text => {
        lyricsArea.value = text;
        console.log("Lyrics updated for selected song.");
      })
      .catch(err => console.error("Error loading lyrics:", err));

    // Construct audio URLs using ACCESS_TOKEN
    const prefix = tamilName; // Keep raw name, do NOT encode
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
