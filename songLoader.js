console.log("songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
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

        const lyricsPath = `lyrics/${selectedSong}.txt`;
        fetch(lyricsPath)
          .then(r => r.ok ? r.text() : Promise.reject("Lyrics not found"))
          .then(text => lyricsTextArea.value = text)
          .catch(() => lyricsTextArea.value = "⚠️ Lyrics not found");

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

            const proceedWithAudio = () => {
              window.currentAudioUrls = {
                vocalUrl: "https://content.dropboxapi.com/2/files/download",
                accUrl: "https://content.dropboxapi.com/2/files/download",
                accessToken: window.accessToken,
                vocalName,
                accName
              };
              if (typeof prepareAudioFromDropbox === "function") {
                prepareAudioFromDropbox();
              }
            };

            if (window.accessToken) {
              console.log("🎯 Token already available. Proceeding with audio...");
              proceedWithAudio();
            } else {
              console.warn("⏳ Token not ready. Deferring audio preparation...");
              window.prepareSongAfterToken = () => {
                console.log("▶️ Deferred audio preparation now running...");
                proceedWithAudio();
              };
            }
          });
      });
    } else {
      console.log("songLoader.js: Waiting for elements...");
    }
  }, 300);
});
