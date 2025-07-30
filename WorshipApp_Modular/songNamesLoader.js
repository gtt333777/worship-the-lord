// songNamesLoader.js

async function loadSongNames() {
  try {
    const response = await fetch("lyrics/songs_names.txt");
    if (!response.ok) throw new Error("songs_names.txt not found");
    const text = await response.text();
    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

    const select = document.getElementById("songSelect");
    select.innerHTML = "";

    lines.forEach((name, idx) => {
      const option = document.createElement("option");
      option.textContent = name;
      option.value = idx + 1;
      select.appendChild(option);
    });

    console.log("Song names loaded successfully!");
  } catch (err) {
    console.error("Failed to load song names:", err);
  }
}

export { loadSongNames };
