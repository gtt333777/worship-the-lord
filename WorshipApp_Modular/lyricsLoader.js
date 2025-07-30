// lyricsLoader.js

export async function loadLyricsForSelectedSong(option) {
  const selectedName = option.value || option.textContent;

  // Step-by-step logging for debugging
  console.log("🔍 Selected song name (raw):", selectedName);

  const trimmedName = selectedName.trim();
  console.log("🔧 Trimmed name:", trimmedName);

  const encodedName = encodeURIComponent(trimmedName);
  console.log("🌐 Encoded file name:", encodedName);

  const lyricsUrl = `lyrics/${encodedName}.txt`;
  console.log("📂 Final lyrics file path:", lyricsUrl);

  try {
    const res = await fetch(lyricsUrl);
    if (!res.ok) throw new Error("Not found");
    const text = await res.text();
    document.getElementById("lyricsBox").value = text;
  } catch (err) {
    console.error("❌ Error loading lyrics:", err.message);
    document.getElementById("lyricsBox").value = "Lyrics not found.";
    alert(`❌ Lyrics file not found for:\n"${selectedName}"\nURL: ${lyricsUrl}`);
  }
}
