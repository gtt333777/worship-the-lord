async function loadSongNames() {
  try {
    // ✅ Attempt to list available .txt files (may fail silently on Netlify)
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;
    console.log("📄 Found lyrics files:", matches);

    // ✅ Load Tamil song names
    const nameRes = await fetch("lyrics/songs_names.txt");
    if (!nameRes.ok) {
      throw new Error(`Failed to fetch songs_names.txt: ${nameRes.status}`);
    }
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n");

    // ✅ Populate dropdown
    const select = document.getElementById("songSelect");
    select.innerHTML = "";
    for (const name of songNames) {
      const clean = name.trim();
      const option = document.createElement("option");
      option.value = clean;
      option.textContent = clean;
      select.appendChild(option);
    }

    console.log("✅ Tamil song names loaded into dropdown:", songNames);
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}
