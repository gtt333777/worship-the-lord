// ✅ songLoader.js — Finalized version inspired by Gold Standard

console.log("🎼 songLoader.js: Started");

document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");

  if (!songSelect) {
    console.error("❌ songSelect dropdown not found.");
    return;
  }

  songSelect.addEventListener("change", () => {
    const selectedSongName = songSelect.value.trim();
    console.log(`🎵 songLoader.js: Selected song: ${selectedSongName}`);

    // 🔁 Load loop segments
    const loopJsonPath = `lyrics/${selectedSongName}_loops.json`;
    console.log(`📁 Fetching loop JSON: ${loopJsonPath}`);

    fetch(loopJsonPath)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(loops => {
        console.log(`✅ Loaded loops: ${loops.length} segment(s)`);

        const loopContainer = document.getElementById("loopButtonsContainer");
        if (!loopContainer) {
          console.error("❌ loopButtonsContainer not found.");
          return;
        }

        loopContainer.innerHTML = ""; // Clear previous buttons
        loops.forEach((loop, index) => {
          const btn = document.createElement("button");
          btn.textContent = `Segment ${index + 1}`;
          btn.className = "segment-button";
          btn.onclick = () => {
            console.log(`▶️ Playing Segment ${index + 1}:`, loop);
            // Playback logic can be added here if needed
          };
          loopContainer.appendChild(btn);
        });
      })
      .catch(err => {
        console.error("❌ Failed to load loop JSON:", err);
        const loopContainer = document.getElementById("loopButtonsContainer");
        if (loopContainer) loopContainer.innerHTML = ""; // Clear on failure
      });

    // 🎧 Set audio URLs for vocal & accompaniment
    const vocalUrl = `${selectedSongName}_vocal.mp3`;
    const accUrl = `${selectedSongName}_acc.mp3`;
    console.log(`🎧 Vocal URL: ${vocalUrl}`);
    console.log(`🎼 Accompaniment URL: ${accUrl}`);

    // ✅ Assign audio URLs to global vars for use in audioControl
    window.currentVocalUrl = vocalUrl;
    window.currentAccUrl = accUrl;
  });
});
