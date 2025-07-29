// === initApp.js ===

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const songSelect = document.getElementById("songSelect");
const lyricsArea = document.getElementById("lyricsArea");

// === 1. Play / Pause buttons with safeguard ===
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

// === 2. Song selection logic ===
songSelect.addEventListener("change", async () => {
  const selectedTamilName = songSelect.value;

  // === 2A: Load lyrics ===
  fetch(`lyrics/${selectedTamilName}.txt`)
    .then(res => res.text())
    .then(text => {
      lyricsArea.value = text;
      console.log("Lyrics loaded successfully!");
    })
    .catch(err => {
      console.error("Error loading lyrics:", err);
      lyricsArea.value = "Lyrics not found.";
    });

  // === 2B: Load audio using songLoader.js helper ===
  await streamSelectedSong(selectedTamilName);
});
