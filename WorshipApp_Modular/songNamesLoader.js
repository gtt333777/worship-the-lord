// songNamesLoader.js

function populateSongDropdown() {
  console.log("✅ populateSongDropdown: Starting fetch of lyrics/songs_names.txt");

  fetch("lyrics/songs_names.txt")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch songs_names.txt");
      return response.text();
    })
    .then((text) => {
      const songDropdown = document.getElementById("songDropdown");

      if (!songDropdown) {
        console.error("❌ songDropdown element not found in DOM.");
        return;
      }

      const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
      console.log(`🎵 Found ${lines.length} song name(s) in file.`);

      lines.forEach((line) => {
        const option = document.createElement("option");
        option.value = line;
        option.textContent = line;
        songDropdown.appendChild(option);
      });
    })
    .catch((err) => {
      console.error("❌ Error loading songs_names.txt:", err);
    });
}

// Delay populate until DOM is ready and htmlLoader finishes injecting
document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    if (document.getElementById("songDropdown")) {
      populateSongDropdown();
      observer.disconnect(); // ✅ Done, stop watching
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
