function loadLyricsForSelectedSong(selectElement) {
  const selected = selectElement.value;
  console.log("🎵 Selected Tamil song name from dropdown:", selected);

  const lyricsFile = `lyrics/${selected}.txt`;
  console.log("📄 Constructed lyrics file path:", lyricsFile);

  fetch(lyricsFile)
    .then((response) => {
      console.log("📡 Fetch response status:", response.status);
      if (!response.ok) {
        throw new Error(`❌ Failed to fetch lyrics. Status: ${response.status}`);
      }
      return response.text();
    })
    .then((text) => {
      document.getElementById("lyricsArea").value = text;
      console.log("✅ Lyrics loaded and displayed in textarea.");
    })
    .catch((err) => {
      console.error("🚨 Error loading lyrics file:", err);
      document.getElementById("lyricsArea").value =
        "⚠️ Lyrics file not found: " + lyricsFile + "\n\n" + err;
    });

  // Attach listener only once
  if (!selectElement._lyricsListenerAttached) {
    selectElement.addEventListener("change", () => loadLyricsForSelectedSong(selectElement));
    selectElement._lyricsListenerAttached = true;
  }
}
