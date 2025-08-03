// songNamesLoader.js
console.log("songNamesLoader.js: Starting up");

window.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("songSelect");
  if (!dropdown) {
    console.error("❌ songNamesLoader.js: #songSelect not found");
    return;
  }

  fetch("lyrics/songs_names.txt")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load songs_names.txt");
      return response.text();
    })
    .then(text => {
      const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

      console.log(`🎵 Found ${lines.length} song(s) in file.`);

      dropdown.innerHTML = ""; // Clear old options
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Choose a song";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      dropdown.appendChild(defaultOption);

      lines.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        dropdown.appendChild(opt);
      });
    })
    .catch(error => {
      console.error("❌ songNamesLoader.js: Error loading songs:", error);
      dropdown.innerHTML = `<option>Error loading songs</option>`;
    });
});
