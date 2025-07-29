// === INIT APP ===

document.addEventListener("DOMContentLoaded", async () => {
  await loadDropboxToken(); // Ensure token is ready

  if (typeof populateSongList === "function") {
    await populateSongList();
  } else {
    console.error("populateSongList is not defined!");
  }

  console.log("App initialized.");
});

document.getElementById("songSelect").addEventListener("change", async (e) => {
  const tamilName = (e.target.value || "").trim();
  await loadLyrics(tamilName);
  await streamSelectedSong(tamilName);
});
