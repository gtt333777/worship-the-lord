document.addEventListener("DOMContentLoaded", function () {
  const songSelect = document.getElementById("songSelect");
  const lyricsTextArea = document.getElementById("lyricsTextArea");
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");

  if (!songSelect || !lyricsTextArea || !loopButtonsContainer) {
    console.warn("songLoader.js: Waiting for #songSelect, #lyricsTextArea, and #loopButtonsContainer...");
    return;
  }

  songSelect.addEventListener("change", async function () {
    const selectedSong = songSelect.value.trim();
    if (!selectedSong) return;

    const suffix = selectedSong;
    console.log(`🎵 songLoader.js: Selected song suffix: ${suffix}`);

    // 🔁 Load loops
    const loopsUrl = `lyrics/${suffix}_loops.json`;
    console.log(`🔁 songLoader.js: Fetching loops from ${loopsUrl}`);
    try {
      const loopsResponse = await fetch(loopsUrl);
      if (!loopsResponse.ok) throw new Error("Loop file not found");
      const loops = await loopsResponse.json();
      renderLoopSegments(loops); // global function
      console.log("✅ songLoader.js: Loops loaded successfully.");
    } catch (error) {
      console.warn("⚠️ songLoader.js: Failed to load loop file", error);
      loopButtonsContainer.innerHTML = ""; // Clear if not found
    }

    // 📖 Load lyrics
    const lyricsUrl = `lyrics/${suffix}.txt`;
    console.log(`📖 songLoader.js: Fetching lyrics from ${lyricsUrl}`);
    try {
      const lyricsResponse = await fetch(lyricsUrl);
      if (!lyricsResponse.ok) throw new Error("Lyrics file not found");
      const lyrics = await lyricsResponse.text();
      lyricsTextArea.value = lyrics;
      console.log("✅ songLoader.js: Lyrics loaded successfully.");
    } catch (error) {
      console.warn("⚠️ songLoader.js: Failed to load lyrics file", error);
      lyricsTextArea.value = "Lyrics not found.";
    }

    // 🔊 Set up audio URLs using suffix
    const vocalUrl = await getTemporaryDropboxLink(`${suffix}_vocal.mp3`);
    const accompUrl = await getTemporaryDropboxLink(`${suffix}_acc.mp3`);
    if (vocalUrl && accompUrl) {
      vocalAudio.src = vocalUrl;
      accompAudio.src = accompUrl;
      console.log("🔊 songLoader.js: Assigned audio URLs:");
      console.log("   🎤 vocalAudio.src =", vocalUrl);
      console.log("   🎶 accompAudio.src =", accompUrl);
    } else {
      console.error("❌ songLoader.js: Failed to assign audio URLs.");
    }
  });
});

// ✅ Dropbox short-lived URL fetcher
async function getTemporaryDropboxLink(fileName) {
  const dropboxPath = `/WorshipSongs/${fileName}`;
  const encodedPath = encodeURIComponent(dropboxPath);
  const endpoint = `/.netlify/functions/getDropboxLink?path=${encodedPath}`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch from Netlify");
    const { url } = await response.json();
    return url;
  } catch (err) {
    console.error("❌ getTemporaryDropboxLink failed for", fileName, err);
    return null;
  }
}
