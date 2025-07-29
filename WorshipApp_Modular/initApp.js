// WorshipApp_Modular/initApp.js
//This script triggers the stream and loads lyrics when a song is selected:

document.getElementById("songSelect").addEventListener("change", async () => {
  const selectedTamilName = document.getElementById("songSelect").value;

  // Load lyrics
  fetch(`lyrics/${selectedTamilName}.txt`)
    .then(res => res.text())
    .then(text => {
      document.getElementById("lyricsArea").value = text;
      console.log("Lyrics loaded successfully.");
    })
    .catch(err => console.error("Error loading lyrics:", err));

  // Load and stream audio
  await streamSelectedSong(selectedTamilName);
});
