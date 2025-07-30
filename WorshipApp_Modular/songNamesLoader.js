async function loadSongNames() {
  try {
    const response = await fetch("lyrics/songs_names.txt");
    const text = await response.text();
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    
    const select = document.getElementById("songSelect");
    select.innerHTML = "";

    lines.forEach((name, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = name;
      select.appendChild(option);
    });

    console.log("Song names loaded successfully!");
  } catch (err) {
    console.error("Error loading song names:", err);
  }
}

export { loadSongNames };
