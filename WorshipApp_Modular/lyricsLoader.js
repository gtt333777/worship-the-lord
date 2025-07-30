// lyricsLoader.js
export function loadLyricsForSelectedSong() {
  const select = document.getElementById("songSelect");
  const rawName = select.value;

  console.log("🎵 Selected song name (raw):", rawName);

  const trimmed = rawName.trim();
  console.log("✂️ Trimmed name:", trimmed);

  // ❌ Removed encodeURIComponent — it breaks Tamil file names
  // const encoded = encodeURIComponent(trimmed);
  // console.log("🔤 Encoded file name:", encoded);

  const filePath = `lyrics/${trimmed}.txt`;
  console.log("📄 Final lyrics file path:", filePath);

  fetch(filePath)
    .then((res) => {
      if (!res.ok) throw new Error("Lyrics file not found.");
      return res.text();
    })
    .then((text) => {
      document.getElementById("lyricsBox").value = text;
    })
    .catch((err) => {
      console.error("❌ Error loading lyrics:", err.message);
      document.getElementById("lyricsBox").value = "Lyrics not found.";
    });
}
