// === Song Names Loader ===
async function loadSongNames() {
  try {
    // Fetch the song names from the 'lyrics/song_names.txt' file
    const response = await fetch('lyrics/song_names.txt');
    
    if (!response.ok) {
      throw new Error('Song names file not found!');
    }

    // Retrieve the song names as plain text
    const songNamesText = await response.text();
    
    // Split the text into individual song names (based on line breaks)
    const songNames = songNamesText.split("\n").map(song => song.trim()).filter(Boolean);

    // Populate the song select dropdown
    const songSelect = document.getElementById("songSelect");
    songSelect.innerHTML = ""; // Clear existing options

    // Add a default "Select a song" option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "🎵 Select a song";
    songSelect.appendChild(defaultOption);

    // Add each song name as an option in the dropdown
    songNames.forEach(songName => {
      const option = document.createElement("option");
      option.value = songName;
      option.textContent = songName;
      songSelect.appendChild(option);
    });

    // Optionally, automatically load the first song's lyrics after it's loaded
    if (songNames.length > 0) {
      loadLyrics(songNames[0]); // Load lyrics for the first song
    }
    
    console.log("Song names loaded successfully!");
  } catch (error) {
    console.error("Error loading song names:", error);
  }
}

// Call loadSongNames to populate the dropdown on page load
document.addEventListener("DOMContentLoaded", loadSongNames);
