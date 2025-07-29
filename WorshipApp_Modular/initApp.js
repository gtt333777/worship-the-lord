// === INIT APP ===

document.addEventListener("DOMContentLoaded", async () => {
  await loadDropboxToken(); // Ensure token is ready
  await populateSongList(); // Populate the song dropdown
  console.log("App initialized successfully.");
});

document.getElementById("songSelect").addEventListener("change", async (e) => {
  const tamilName = (e.target.value || "").trim();
  await loadLyrics(tamilName);
  await streamSelectedSong(tamilName);
});
