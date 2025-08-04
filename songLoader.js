console.log("songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  let pendingAudioSetup = false;

  const checkInterval = setInterval(() => {
    const songSelect = document.getElementById("songSelect");
    const lyricsTextArea = document.getElementById("lyricsTextArea");
    const loopButtonsContainer = document.getElementById("loopButtonsContainer");

    if (songSelect && lyricsTextArea && loopButtonsContainer) {
      clearInterval(checkInterval);
      console.log("songLoader.js: Elements found, setting up handler");

      songSelect.addEventListener("change", () => {
        const selectedSong = songSelect.value.trim();
        if (!selectedSong) return;

        window.selectedSongName = selectedSong;
        window.dropboxFileID = "4212erw3ouxgx3lmd2rsk";
        window.dropboxRlKey = "t8b5y04pe4lprncj188540ghj";

        // Load lyrics
        const lyricsPath = `lyrics/${selectedSong}.txt`;
        fetch(lyricsPath)
          .then(r => r.ok ? r.text() : Promise.reject("Lyrics not found"))
          .then(text => lyricsTextArea.value = text)
          .catch(() => lyricsTextArea.value = "⚠️ Lyrics not found");

        // Load loops
        const loopsPath = `lyrics/${selectedSong}_loops.json`;
        fetch(loopsPath)
          .then(r => r.ok ? r.json() : Promise.reject("Loop file not found"))
          .then(loops => {
            loopButtonsContainer.innerHTML = "";
            loops.forEach((loop, i) => {
              const btn = document.createElement("button");
              btn.textContent = `Segment ${i + 1}`;
              loopButtonsContainer.appendChild(btn);
            });

            const vocalName = `${selectedSong}_vocal.mp3`;
            const accName = `${selectedSong}_acc.mp3`;

            console.log("songLoader.js: Requesting Dropbox access token...");
            fetch("/.netlify/functions/getDropboxToken")
              .then(res => res.json())
              .then(({ access_token }) => {
                console.log("songLoader.js: Received Dropbox token");
                window.currentAudioUrls = {
                  vocalUrl: "https://content.dropboxapi.com/2/files/download",
                  accUrl: "https://content.dropboxapi.com/2/files/download",
                  accessToken: access_token,
                  vocalName,
                  accName
                };
                if (typeof prepareAudioFromDropbox === "function") {
                  console.log("songLoader.js: Preparing audio now...");
                  prepareAudioFromDropbox();
                } else {
                  console.warn("songLoader.js: Audio function not ready, will retry shortly...");
                  pendingAudioSetup = true;
                }
              })
              .catch(err => {
                console.error("songLoader.js: Failed to get token", err);
              });
          });
      });
    } else {
      console.log("songLoader.js: Waiting for elements...");
    }
  }, 300);

  // Retry prepareAudioFromDropbox when it's ready
  const retryInterval = setInterval(() => {
    if (pendingAudioSetup && typeof prepareAudioFromDropbox === "function") {
      console.log("songLoader.js: Retrying deferred audio setup...");
      prepareAudioFromDropbox();
      pendingAudioSetup = false;
    }
  }, 500);
});
