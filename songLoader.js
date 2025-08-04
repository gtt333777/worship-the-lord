console.log("songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  const checkInterval = setInterval(() => {
    const songSelect = document.getElementById("songSelect");
    const lyricsTextArea = document.getElementById("lyricsTextArea");
    const loopButtonsContainer = document.getElementById("loopButtonsContainer");

    if (songSelect && lyricsTextArea && loopButtonsContainer) {
      clearInterval(checkInterval);
      console.log("songLoader.js: #songSelect, #lyricsTextArea, and #loopButtonsContainer found");

      songSelect.addEventListener("change", () => {
        const selectedSong = songSelect.value.trim();
        if (!selectedSong) return;

        // Load lyrics
        const lyricsPath = `lyrics/${selectedSong}.txt`;
        console.log(`lyricsLoader.js: Fetching lyrics for ${selectedSong}`);
        fetch(lyricsPath)
          .then(response => {
            if (!response.ok) throw new Error("Lyrics file not found");
            return response.text();
          })
          .then(text => {
            lyricsTextArea.value = text;
            console.log(`lyricsLoader.js: Loaded lyrics for ${selectedSong}`);
          })
          .catch(err => {
            lyricsTextArea.value = "⚠️ Lyrics not found.";
            console.warn(`lyricsLoader.js: Could not load lyrics for ${selectedSong}`);
          });

        // Load loops
        const loopsPath = `lyrics/${selectedSong}_loops.json`;
        console.log(`🔁 Fetching loops from ${loopsPath}`);
        fetch(loopsPath)
          .then(response => {
            if (!response.ok) throw new Error("Loop file not found");
            return response.json();
          })
          .then(loops => {
            console.log(`🔁 Loaded ${loops.length} segment(s)`);

            // Clear old buttons
            loopButtonsContainer.innerHTML = "";

            // Create new buttons
            loops.forEach((loop, index) => {
              const btn = document.createElement("button");
              btn.textContent = `Segment ${index + 1}`;
              btn.style.margin = "5px";
              btn.addEventListener("click", () => {
                console.log(`▶️ User clicked Segment ${index + 1}`);
                // Placeholder: playback logic can go here
              });
              loopButtonsContainer.appendChild(btn);
            });
          })
          .catch(err => {
            loopButtonsContainer.innerHTML = "";
            console.warn("⚠️ songLoader.js: Could not load loops: Loop file not found");
          });
      });
    } else {
      console.log("songLoader.js: Waiting for #songSelect and #lyricsTextArea and #loopButtonsContainer...");
    }
  }, 300);
});
