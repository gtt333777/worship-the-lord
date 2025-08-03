// lyricsLoader.js

console.log("lyricsLoader.js: Started");

let attemptCount = 0;
let lyricsInitInterval = setInterval(() => {
  const lyricsTextArea = document.getElementById("lyricsBox");
  const songSelect = document.getElementById("songSelect");

  if (!lyricsTextArea || !songSelect) {
    attemptCount++;
    if (attemptCount % 5 === 0) {
      console.warn("lyricsLoader.js: Still waiting for textarea and song select...");
    }
    if (attemptCount > 50) {
      clearInterval(lyricsInitInterval);
      console.error("lyricsLoader.js: Giving up after too many attempts.");
    }
    return;
  }

  clearInterval(lyricsInitInterval);
  console.log("lyricsLoader.js: Elements found. Initializing event listener.");

  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    const suffix = selectedSong.trim();
    const lyricsFilePath = `lyrics/${suffix}.txt`;

    fetch(lyricsFilePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch lyrics for ${suffix}`);
        }
        return response.text();
      })
      .then((text) => {
        lyricsTextArea.value = text;
        console.log(`lyricsLoader.js: Loaded lyrics for ${suffix}`);
      })
      .catch((error) => {
        console.error("lyricsLoader.js: Error loading lyrics:", error);
        lyricsTextArea.value = "[Lyrics not found]";
      });
  });

  console.log("lyricsLoader.js: Loaded");
}, 300);
