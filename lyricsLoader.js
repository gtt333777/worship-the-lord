// lyricsLoader.js
console.log("lyricsLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("lyricsLoader.js: DOMContentLoaded fired");

  const waitForElements = setInterval(() => {
    const songSelect = document.getElementById("songSelect");
    const lyricsTextArea = document.getElementById("lyricsTextArea");

    if (songSelect && lyricsTextArea) {
      clearInterval(waitForElements);
      console.log("lyricsLoader.js: Found dropdown and textarea");

      songSelect.addEventListener("change", () => {
        const selectedSong = songSelect.value.trim();
        const lyricsFilePath = `lyrics/${encodeURIComponent(selectedSong)}.txt`;
        console.log(`lyricsLoader.js: Fetching lyrics for ${selectedSong}`);

        fetch(lyricsFilePath)
          .then((response) => {
            if (!response.ok) throw new Error(`Lyrics not found for ${selectedSong}`);
            return response.text();
          })
          .then((text) => {
            lyricsTextArea.value = text;
            console.log(`lyricsLoader.js: Loaded lyrics for ${selectedSong}`);
          })
          .catch((error) => {
            console.error("lyricsLoader.js: Error fetching lyrics:", error);
            lyricsTextArea.value = "[Lyrics not found]";
          });
      });
    } else {
      console.log("lyricsLoader.js: Waiting for #songSelect and #lyricsTextArea...");
    }
  }, 100);
});
