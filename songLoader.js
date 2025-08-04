let dropboxFileID = "";
let dropboxRlKey = "";

document.addEventListener("DOMContentLoaded", () => {
  fetch("lyrics/songs_names.txt")
    .then((res) => res.text())
    .then((text) => {
      const lines = text.trim().split("\n");
      const dropdown = document.getElementById("songDropdown");
      dropdown.innerHTML = "";

      lines.forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name.trim();
        opt.textContent = name.trim();
        dropdown.appendChild(opt);
      });

      dropdown.addEventListener("change", () => {
        const selectedName = dropdown.value.trim();
        if (!selectedName) return;

        window.selectedSongName = selectedName;
        const prefix = selectedName; // no need to encode manually, Dropbox handles this

        dropboxFileID = "4212erw3ouxgx3lmd2rsk"; // your actual folder ID
        dropboxRlKey = "t8b5y04pe4lprncj188540ghj"; // from Dropbox link

        loadLyrics(prefix);
        loadLoopSegments(prefix);
        prepareAudioFromDropbox(prefix);
      });

      dropdown.dispatchEvent(new Event("change")); // load first song on startup
    });
});

function loadLyrics(prefix) {
  fetch(`lyrics/${prefix}.txt`)
    .then((res) => res.text())
    .then((text) => {
      document.getElementById("lyricsTextArea").value = text;
      console.log("lyricsLoader.js: Loaded lyrics for", prefix);
    })
    .catch((err) => {
      console.error("Failed to load lyrics:", err);
    });
}

function loadLoopSegments(prefix) {
  fetch(`lyrics/${prefix}_loops.json`)
    .then((res) => res.json())
    .then((data) => {
      window.loopSegments = data;
      renderLoopButtons(data);
      console.log("Loaded", data.length, "segments");
    })
    .catch((err) => {
      console.warn("No loop JSON found for", prefix);
      window.loopSegments = [];
      renderLoopButtons([]);
    });
}
