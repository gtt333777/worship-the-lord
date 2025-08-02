document.addEventListener("DOMContentLoaded", () => {
  console.log("📖 lyricsLoader.js: DOM loaded");

  // Delay to ensure modular HTML injection is done
  setTimeout(() => {
    const dropdown = document.getElementById("songDropdown");
    const lyricsDisplay = document.getElementById("lyricsDisplay");

    if (!dropdown) {
      console.warn("⚠️ lyricsLoader.js: songDropdown not found in DOM.");
      return;
    }
    if (!lyricsDisplay) {
      console.warn("⚠️ lyricsLoader.js: lyricsDisplay textarea not found in DOM.");
      return;
    }

    dropdown.addEventListener("change", () => {
      const selectedName = dropdown.value.trim();
      console.log(`🎵 lyricsLoader.js: Selected song = "${selectedName}"`);

      if (!selectedName) {
        lyricsDisplay.value = "";
        return;
      }

      // Try to find a matching .txt file from lyrics folder
      fetch("lyrics/songs_names.txt")
        .then((res) => {
          if (!res.ok) throw new Error("❌ Failed to load songs_names.txt");
          return res.text();
        })
        .then((txt) => {
          const lines = txt.split("\n").map(line => line.trim()).filter(Boolean);
          const match = lines.find(line => selectedName === line);

          if (!match) {
            console.warn(`⚠️ lyricsLoader.js: No match found for selected name "${selectedName}"`);
            lyricsDisplay.value = "[Lyrics not found]";
            return;
          }

          // Derive prefix from match (e.g., first word, or matched filename)
          const prefix = match
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents if needed
            .replace(/\s+/g, "_") // convert spaces to _
            .replace(/[^\w]/g, ""); // strip non-word chars

          const lyricsPath = `lyrics/${prefix}.txt`;
          console.log(`📂 lyricsLoader.js: Attempting to load "${lyricsPath}"`);

          fetch(lyricsPath)
            .then((res) => {
              if (!res.ok) throw new Error(`❌ Cannot load file: ${lyricsPath}`);
              return res.text();
            })
            .then((lyrics) => {
              console.log(`✅ lyricsLoader.js: Successfully loaded lyrics for "${selectedName}"`);
              lyricsDisplay.value = lyrics;
            })
            .catch((err) => {
              console.error("🚫 lyricsLoader.js:", err);
              lyricsDisplay.value = "[Error loading lyrics]";
            });
        })
        .catch((err) => {
          console.error("🚫 lyricsLoader.js:", err);
          lyricsDisplay.value = "[Error loading song list]";
        });
    });
  }, 100); // delay to allow HTML injection
});
