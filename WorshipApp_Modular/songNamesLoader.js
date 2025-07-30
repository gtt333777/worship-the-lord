function loadSongNames() {
  fetch("lyrics/songs_names.txt")
    .then(response => {
      if (!response.ok) throw new Error("songs_names.txt not found");
      return response.text();
    })
    .then(text => {
      const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const dropdown = document.getElementById("songSelect");
      dropdown.innerHTML = ""; // Clear existing options

      lines.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
      });

      console.log("✅ Tamil song names loaded into dropdown");
    })
    .catch(err => {
      console.error("❌ Error loading songs_names.txt:", err);
    });
}
