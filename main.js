async function loadSongs() {
  const response = await fetch("lyrics/song_names.txt");
  const names = (await response.text()).split('\n').map(n => n.trim()).filter(Boolean);

  const select = document.getElementById("songSelect");
  names.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  loadLyrics(names[0]); // Load the first song by default
}

async function loadLyrics(name) {
  const filePath = `lyrics/${name}.txt`;
  const box = document.getElementById("lyricsBox");
  box.value = "Loading...";

  try {
    const res = await fetch(filePath);
    const text = await res.text();
    box.value = text;
    box.scrollTop = 0;
  } catch (err) {
    box.value = "Failed to load lyrics.";
  }
}

document.getElementById("songSelect").addEventListener("change", e => {
  loadLyrics(e.target.value);
});

loadSongs();
