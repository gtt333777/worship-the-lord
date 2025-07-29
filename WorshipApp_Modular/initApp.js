// initApp.js

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const songSelect = document.getElementById("songSelect");
const lyricsArea = document.getElementById("lyricsArea");

playBtn.addEventListener("click", async () => {
  if (window.vocalAudio && window.accompAudio) {
    try {
      await Promise.all([
        window.vocalAudio.play(),
        window.accompAudio.play()
      ]);
    } catch (err) {
      console.error("Playback failed:", err);
    }
  }
});

pauseBtn.addEventListener("click", () => {
  if (window.vocalAudio && window.accompAudio) {
    window.vocalAudio.pause();
    window.accompAudio.pause();
  }
});

// ✅ Main logic: On song change
songSelect.addEventListener("change", async () => {
  const selectedTamilName = songSelect.value;

  // ✅ Load lyrics from local /lyrics/ folder
  try {
    const res = await fetch(`lyrics/${selectedTamilName}.txt`);
    const text = await res.text();
    lyricsArea.value = text;
    console.log("Lyrics loaded successfully!");
  } catch (err) {
    console.error("Error loading lyrics:", err);
    lyricsArea.value = "Lyrics not found.";
  }

  // ✅ Stream the correct audio
  try {
    await streamSelectedSong(selectedTamilName);
  } catch (err) {
    console.error("streamSelectedSong failed:", err);
  }
});
