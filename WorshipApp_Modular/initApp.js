// === App Initializer ===
document.addEventListener("DOMContentLoaded", () => {
  try {
    const songSelect = document.getElementById("songSelect");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");

    if (!songSelect || !playBtn || !pauseBtn) {
      console.error("Missing essential DOM elements.");
      return;
    }

    playBtn.addEventListener("click", () => {
      if (vocalAudio && accompAudio) {
        vocalAudio.play().catch(err => console.error("Vocal play error:", err));
        accompAudio.play().catch(err => console.error("Accompaniment play error:", err));
      }
    });

    pauseBtn.addEventListener("click", () => {
      if (vocalAudio && accompAudio) {
        vocalAudio.pause();
        accompAudio.pause();
      }
    });

    songSelect.addEventListener("change", async () => {
      const selectedTamilName = songSelect.value;

      // Load lyrics
      fetch(`lyrics/${selectedTamilName}.txt`)
        .then(res => res.text())
        .then(text => {
          document.getElementById("lyricsArea").value = text;
          console.log("Lyrics loaded successfully.");
        })
        .catch(err => console.error("Error loading lyrics:", err));

      // Load audio
      await streamSelectedSong(selectedTamilName);
    });

  } catch (error) {
    console.error("Initialization error:", error);
    alert("Something went wrong during app initialization.");
  }
});
