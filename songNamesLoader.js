// songNamesLoader.js
console.log("🎵 songNamesLoader.js: Starting...");

window.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");

  if (!songSelect) {
    console.error("❌ songNamesLoader.js: #songSelect not found in DOM");
    return;
  }

  console.log("✅ songNamesLoader.js: #songSelect found");

  fetch("lyrics/songs_names.txt")
    .then(response => {
      console.log(`📄 Fetching lyrics/songs_names.txt — Status: ${response.status}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then(text => {
      const songNames = text.split('\n').map(name => name.trim()).filter(Boolean);
      console.log(`🎶 Found ${songNames.length} song name(s):`, songNames);

      // Clear existing options
      songSelect.innerHTML = "";

      // Add default option
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Choose a song";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      songSelect.appendChild(defaultOption);

      // Add each song as option
      songNames.forEach(name => {
        const option = document.createElement("option");
        option.textContent = name;
        option.value = name;
        songSelect.appendChild(option);
      });

      console.log("✅ songNamesLoader.js: Dropdown populated successfully");
    })
    .catch(error => {
      console.error("❌ songNamesLoader.js: Failed to load song names:", error);
      songSelect.innerHTML = "<option>Error loading songs</option>";
    });
});
