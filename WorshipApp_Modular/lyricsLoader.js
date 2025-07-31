document.getElementById("songSelect").addEventListener("change", async (e) => {
  const selected = e.target.value;
  console.log("🎵 Selected Tamil song name from dropdown:", selected);

  const lyricsFile = `lyrics/${selected}.txt`;
  console.log("📄 Constructed lyrics file path:", lyricsFile);

  try {
    const response = await fetch(lyricsFile);
    console.log("📡 Fetch response status:", response.status);

    if (!response.ok) {
      throw new Error(`❌ Failed to fetch lyrics. Status: ${response.status}`);
    }

    const text = await response.text();
    document.getElementById("lyricsArea").value = text;

    console.log("✅ Lyrics loaded and displayed in textarea.");
  } catch (err) {
    console.error("🚨 Error loading lyrics file:", err);
    document.getElementById("lyricsArea").value =
      "⚠️ Lyrics file not found: " + lyricsFile + "\n\n" + err;
  }
});
