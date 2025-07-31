async function loadSongNames() {
  try {
    // Get list of .txt files in lyrics/ folder (to derive prefixes later)
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;
    console.log("📄 Found lyrics files:", matches);

    // Load Tamil names from songs_names.txt
    const nameRes = await fetch("lyrics/songs_names.txt");
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n");

    const select = document.getElementById("songSelect");
    select.innerHTML = "";
    for (const name of songNames) {
      const option = document.createElement("option");
      option.value = name.trim();
      option.textContent = name.trim();
      select.appendChild(option);
    }

    // Handle selection change
    select.addEventListener("change", () => {
      const selected = select.value;
      window.currentTamilSongName = selected;
      document.getElementById("bookmarkThisBtn").style.display = selected ? "inline-block" : "none";
      console.log("🎵 Selected:", selected);
    });

    // Trigger once to initialize current song
    select.dispatchEvent(new Event("change"));

    console.log("✅ Tamil song names loaded into dropdown");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}
