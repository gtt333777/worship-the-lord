// songNamesLoader.js

fetch("lyrics/songs_names.txt")
  .then(res => res.text())
  .then(text => {
    const lines = text.split("\n").filter(Boolean);
    const select = document.getElementById("songSelect");
    const prefixMap = {};

    lines.forEach((line, index) => {
      const tamilName = line.trim();
      const prefix = `song${index + 1}`;

      const option = document.createElement("option");
      option.textContent = tamilName;
      option.value = tamilName;
      select.appendChild(option);

      prefixMap[tamilName] = prefix;
    });

    // Make accessible globally
    window.songPrefixMap = prefixMap;

    console.log("Song names loaded successfully!");
  })
  .catch(err => console.error("Error loading song names:", err));
