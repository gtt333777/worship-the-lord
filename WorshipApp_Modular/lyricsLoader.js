let tamilSongNames = [];
let lyricsPrefixes = [];

async function loadTamilSongNames() {
  const response = await fetch("lyrics/songs_names.txt");
  const text = await response.text();
  tamilSongNames = text.trim().split("\n").map(line => line.trim());

  // Generate corresponding prefixes automatically (same order as lyrics files)
  lyricsPrefixes = tamilSongNames.map(name => {
    return name
      .normalize("NFD")                     // Handle Unicode Tamil properly
      .replace(/[\u0300-\u036f]/g, "")      // Remove diacritics
      .replace(/[^\w\s]/gi, "")             // Remove punctuation
      .replace(/\s+/g, "")                  // Remove all spaces
      .toLowerCase();                       // Convert to lowercase
  });

  // Fill dropdown
  const songSelect = document.getElementById("songSelect");
  tamilSongNames.forEach(name => {
    const option = document.createElement("option");
    option.textContent = name;
    songSelect.appendChild(option);
  });
}

async function loadLyricsForSelectedSong(selectedOption) {
  const selectedName = selectedOption.textContent.trim();
  const index = tamilSongNames.findIndex(name => name === selectedName);

  if (index === -1 || !lyricsPrefixes[index]) {
    console.error("Lyrics file not found for:", selectedName);
    document.getElementById("lyricsArea").value = "Lyrics not found.";
    return;
  }

  const lyricsFile = `lyrics/${lyricsPrefixes[index]}.txt`;

  try {
    const response = await fetch(lyricsFile);
    if (!response.ok) throw new Error("File not found");
    const lyrics = await response.text();
    document.getElementById("lyricsArea").value = lyrics;
  } catch (err) {
    console.error("Error loading lyrics:", err);
    document.getElementById("lyricsArea").value = "Lyrics could not be loaded.";
  }
}

export { loadTamilSongNames, loadLyricsForSelectedSong };
