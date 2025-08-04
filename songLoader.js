console.log("🎵 songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  const checkElements = setInterval(() => {
    const songSelect = document.getElementById("songSelect");
    const loopButtonsContainer = document.getElementById("loopButtonsContainer");
    if (songSelect && loopButtonsContainer) {
      clearInterval(checkElements);
      console.log("🎵 songLoader.js: #songSelect, #lyricsTextArea, and #loopButtonsContainer found");

      songSelect.addEventListener("change", async () => {
        const songName = songSelect.value;
        console.log(`🎵 songLoader.js: Song selected: ${songName}`);

        // Prepare audio URLs
        const vocalFile = `${songName}_vocal.mp3`;
        const accFile = `${songName}_acc.mp3`;
        const token = window.currentDropboxAccessToken;

        window.currentAudioUrls = {
          vocal: `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${token}&arg=${encodeURIComponent(
            JSON.stringify({ path: `/WorshipSongs/${vocalFile}` })
          )}`,
          acc: `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${token}&arg=${encodeURIComponent(
            JSON.stringify({ path: `/WorshipSongs/${accFile}` })
          )}`
        };

        console.log("🎧 songLoader.js: Assigned Dropbox audio URLs:");
        console.log("🎙️ Vocal:", window.currentAudioUrls.vocal);
        console.log("🎹 Accompaniment:", window.currentAudioUrls.acc);

        // Load loop file
        const loopFilePath = `lyrics/${songName}_loops.json`;
        try {
          const response = await fetch(loopFilePath);
          if (!response.ok) throw new Error(`Loop file not found: ${loopFilePath}`);
          const loopData = await response.json();

          console.log(`🔁 songLoader.js: Loaded ${loopData.length} loop segments`);

          // Clear previous buttons
          loopButtonsContainer.innerHTML = "";

          // Create buttons for each loop
          loopData.forEach((segment, index) => {
            const button = document.createElement("button");
            button.textContent = `Segment ${index + 1}`;
            button.className = "segment-button";
            button.addEventListener("click", () => {
              window.currentLoopIndex = index;
              console.log(`▶️ songLoader.js: Segment ${index + 1} clicked`);
              if (typeof window.playFromLoopSegment === "function") {
                window.playFromLoopSegment(index, loopData);
              } else {
                console.warn("⚠️ playFromLoopSegment function is not defined");
              }
            });
            loopButtonsContainer.appendChild(button);
          });
        } catch (err) {
          console.warn("⚠️ songLoader.js: No loop file found or failed to load:", err.message);
          loopButtonsContainer.innerHTML = ""; // clear if nothing found
        }
      });
    }
  }, 100);
});
