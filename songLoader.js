console.log("songLoader.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("songLoader.js: Elements found, setting up handler");

  const songDropdown = document.getElementById("songSelect");
  if (!songDropdown) {
    console.warn("songLoader.js: #songSelect not found");
    return;
  }

  songDropdown.addEventListener("change", async () => {
    const selectedSongName = songDropdown.value;
    console.log("🎵 songLoader.js: Selected song", selectedSongName);

    // Save song name globally
    window.currentSongName = selectedSongName;

    // Load lyrics
    loadLyricsForSong(selectedSongName);

    // Fetch loop data
    const prefix = selectedSongName;
    const loopsUrl = `https://content.dropboxapi.com/2/files/download`;
    const loopsPath = `/WorshipSongs/${prefix}_loops.json`;

    try {
      const token = await getDropboxToken();
      console.log("songLoader.js: Received Dropbox token");

      const loopResponse = await fetch(loopsUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({ path: loopsPath })
        }
      });

      if (!loopResponse.ok) throw new Error("Loop fetch failed");

      const loopJson = await loopResponse.json();
      window.currentLoopData = loopJson;
      console.log("🔁 songLoader.js: Loaded loops", loopJson);

      renderLoopSegments(loopJson);
    } catch (err) {
      console.warn("songLoader.js: ❌ Failed to fetch loop JSON. Skipping loops.");
      window.currentLoopData = [];
      renderLoopSegments([]);
    }

    // Prepare audio
    try {
      const token = await getDropboxToken();
      const vocalFile = `${selectedSongName}_vocal.mp3`;
      const accFile = `${selectedSongName}_acc.mp3`;

      prepareAudioFromDropbox(vocalFile, accFile, token);
    } catch (e) {
      console.error("songLoader.js: ❌ Audio token or load failed:", e);
    }
  });
});
