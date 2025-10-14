async function loadSongNames() {
  try {
    // Get list of .txt files in lyrics/ folder
    const res = await fetch("lyrics/");
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)].map(m => m[1]);
    window.availableTxtFiles = matches;

    // Load Tamil names from songs_names.txt
    const nameRes = await fetch("lyrics/songs_names.txt");
    const nameText = await nameRes.text();
    const songNames = nameText.trim().split("\n");

    const select = document.getElementById("songSelect");
    select.innerHTML = "";

    /*
    for (const name of songNames) {
      const option = document.createElement("option");
      option.value = name.trim();
      option.textContent = name.trim();
      select.appendChild(option);
    }
    */
    //Replace the inner part of your loop with this enhanced version 👇
    //(Replace only the loop — everything else can remain same.)
    for (const name of songNames) {
  const option = document.createElement("option");
  const parts = name.trim().split(/\s+(?=[A-Z])/); // split before English part
  const tamil = parts[0] || name.trim();
  const english = parts[1] ? parts.slice(1).join(" ") : "";

  // ✅ Show Tamil on top, English below (using newline)
  option.textContent = english
    ? `${tamil}\n${english}`
    : tamil;

  option.value = name.trim();
  select.appendChild(option);
}





    console.log("✅ Tamil song names loaded into dropdown");
  } catch (err) {
    console.error("❌ Error loading song names:", err);
  }
}
