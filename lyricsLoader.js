// lyricsLoader.js

console.log("lyricsLoader.js: Started");

let lyricsInitAttempts = 0;
const maxAttempts = 100; // retry up to ~30 seconds
const intervalMs = 300;

const tryInitializeLyricsLoader = () => {
  const lyricsTextArea = document.getElementById("lyricsBox");
  const songSelect = document.getElementById("songSelect");

  if (!lyricsTextArea || !songSelect) {
    lyricsInitAttempts++;
    if (lyricsInitAttempts % 5 === 0) {
      console.warn("lyricsLoader.js: Still waiting for textarea and song select...");
    }
    if (lyricsInitAttempts >= maxAttempts) {
      console.error("lyricsLoader.js: Giving up after too many attempts.");
      clearInterval(lyricsInitInterval);
    }
    return;
  }

  clearInterval(lyricsInitInterval);
  console.log("lyricsLoader.js: Elements found. Initializing lyrics system.");

  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    const suffix = selectedSong.trim();
    const lyricsFilePath = `lyrics/${suffix}.txt`;

    fetch(lyricsFilePath)
      .then((response) => {
        if (!response.ok) throw new Error(`Lyrics not found for ${suffix}`);
        return response.text();
      })
      .then((text) => {
        lyricsTextArea.value = text;
        console.log(`lyricsLoader.js: Loaded lyrics for ${suffix}`);
      })
      .catch((error) => {
        console.error("lyricsLoader.js: Error fetching lyrics:", error);
        lyricsTextArea.value = "[Lyrics not found]";
      });
  });

  console.log("lyricsLoader.js: Setup complete.");
};

// Start checking periodically
const lyricsInitInterval = setInterval(tryInitializeLyricsLoader, intervalMs);
