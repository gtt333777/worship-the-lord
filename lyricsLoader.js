console.log("lyricsLoader.js: Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const lyricsArea = document.getElementById("lyricsTextArea");
  const songSelect = document.getElementById("songSelect");

  if (!lyricsArea || !songSelect) {
    console.error("❌ lyricsLoader: Missing textarea or song select element");
    return;
  }

  songSelect.addEventListener("change", () => {
    const tamilName = songSelect.value.trim();
    console.log("📖 lyricsLoader: Song selected =", tamilName);

    fetch("lyrics/")
      .then(response => {
        if (!response.ok) throw new Error("❌ Failed to read lyrics folder");
        return response.text();
      })
      .then(text => {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(text, "text/html");
        const links = [...htmlDoc.querySelectorAll("a")];
        const lyricsFiles = links
          .map(a => a.getAttribute("href"))
          .filter(name => name && name.endsWith(".txt"));

        const match = lyricsFiles.find(name =>
          name.toLowerCase().endsWith(`${tamilName.toLowerCase()}.txt`)
        );

        if (!match) {
          console.warn("⚠️ No matching lyrics file found.");
          lyricsArea.value = "";
          return;
        }

        fetch(`lyrics/${match}`)
          .then(res => res.text())
          .then(content => {
            lyricsArea.value = content;
            console.log("✅ Lyrics loaded:", match);
          })
          .catch(err => {
            console.error("❌ Failed to load lyrics file:", err);
            lyricsArea.value = "";
          });
      })
      .catch(err => {
        console.error("❌ Could not read lyrics folder:", err);
      });
  });
});
