// songNamesLoader.js
export async function loadSongNames() {
  const response = await fetch("lyrics/songs_names.txt");
  const text = await response.text();
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

  const select = document.getElementById("songSelect");
  select.innerHTML = ""; // Clear existing options

  lines.forEach((name, i) => {
    const option = document.createElement("option");
    option.value = name; // ✅ Set full Tamil name as value
    option.textContent = name;
    select.appendChild(option);
  });

  console.log("Song names loaded successfully!");
}
