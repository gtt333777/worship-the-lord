async function loadSongs() {
  try {
    const response = await fetch("lyrics/song_names.txt");
    const songNames = (await response.text()).split('\n').map(s => s.trim()).filter(Boolean);

    const select = document.getElementById("songSelect");
    songNames.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    if (songNames.length > 0) {
      loadLyrics(songNames[0]); // Load first song by default
    }
  } catch (err) {
    console.error("Failed to load song names:", err);
  }
}

async function loadLyrics(name) {
  const prefix = name.trim();
  const lyricsBox = document.getElementById("lyricsBox");

  try {
    const response = await fetch(`lyrics/${prefix}.txt`);
    if (!response.ok) throw new Error("Lyrics file not found");
    const text = await response.text();

    // ✅ This preserves line breaks in desktop & mobile
    lyricsBox.value = text;
    lyricsBox.scrollTop = 0;
  } catch (err) {
    lyricsBox.value = "Lyrics could not be loaded.";
    console.error(err);
  }
}

document.getElementById("songSelect").addEventListener("change", (e) => {
  loadLyrics(e.target.value);
});

loadSongs();
