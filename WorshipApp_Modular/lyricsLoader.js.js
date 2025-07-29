// === Lyrics Loader ===
const lyricsBox = document.getElementById('lyricsBox');  // Assuming lyricsBox is the textarea for displaying lyrics

// Function to load lyrics for a selected song
async function loadLyrics(songPrefix) {
  try {
    // Constructing the lyrics file path based on the song prefix
    const lyricsFilePath = `lyrics/${songPrefix}.txt`;

    // Fetch the lyrics file from the server (local folder)
    const response = await fetch(lyricsFilePath);
    
    if (!response.ok) {
      throw new Error('Lyrics not found for this song.');
    }

    // Fetch the lyrics text
    const lyricsText = await response.text();

    // Update the lyricsBox (textarea) with the lyrics
    lyricsBox.value = lyricsText;

    // Handle any additional processing or formatting if needed (like Unicode handling)
    // For example, handling line breaks or adding custom formatting for display

    console.log("Lyrics loaded successfully!");
  } catch (error) {
    console.error('Error loading lyrics:', error);
    lyricsBox.value = 'Error loading lyrics. Please try again.';
  }
}

// To load lyrics when a song is selected (assuming songSelect is the dropdown)
document.getElementById('songSelect').addEventListener('change', (e) => {
  const selectedSong = e.target.value;
  if (selectedSong) {
    loadLyrics(selectedSong);
  }
});

// Optional: Automatically load lyrics for the first song on page load (if any)
document.addEventListener('DOMContentLoaded', () => {
  const firstSong = document.getElementById('songSelect').value;
  if (firstSong) {
    loadLyrics(firstSong);
  }
});
