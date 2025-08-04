// songLoader.js

let loopSegments = []; // ✅ Globally declare this

document.addEventListener("DOMContentLoaded", function () {
  const songSelect = document.getElementById("songSelect");
  const lyricsTextArea = document.getElementById("lyricsTextArea");
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");

  if (!songSelect || !lyricsTextArea || !loopButtonsContainer) {
    console.error("songLoader.js: Required elements not found");
    return;
  }

  songSelect.addEventListener("change", function () {
    const selectedTamilName = songSelect.value;
    console.log("songLoader.js: Song selected:", selectedTamilName);

    const prefix = getPrefixForTamilName(selectedTamilName);
    if (!prefix) {
      console.error("songLoader.js: Could not find prefix for selected Tamil name:", selectedTamilName);
      return;
    }

    // 🔗 Assign audio URLs
    const vocalUrl = `${DROPBOX_BASE_URL}/${encodeURIComponent("WorshipSongs/" + prefix + "_vocal.mp3")}?authorization=Bearer%20${DROPBOX_ACCESS_TOKEN}`;
    const accompUrl = `${DROPBOX_BASE_URL}/${encodeURIComponent("WorshipSongs/" + prefix + "_acc.mp3")}?authorization=Bearer%20${DROPBOX_ACCESS_TOKEN}`;

    vocalAudio.src = vocalUrl;
    accompAudio.src = accompUrl;
    console.log("songLoader.js: Assigned Dropbox audio URLs:");
    console.log("🎤 Vocal:", vocalUrl);
    console.log("🎶 Accompaniment:", accompUrl);

    // 📜 Load lyrics
    fetch(`lyrics/${prefix}.txt`)
      .then((res) => res.text())
      .then((text) => {
        lyricsTextArea.value = text;
        console.log("songLoader.js: Loaded lyrics for", selectedTamilName);
      })
      .catch((err) => {
        console.error("songLoader.js: Failed to load lyrics for", prefix, err);
      });

    // 🔁 Load loops
    fetch(`https://content.dropboxapi.com/2/files/download`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_ACCESS_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({ path: `/WorshipSongs/${prefix}_loops.json` })
      }
    })
      .then((res) => res.json())
      .then((json) => {
        loopSegments = json.loops || []; // ✅ Store globally
        console.log(`songLoader.js: Loaded ${loopSegments.length} loop segments`);

        // 🎛️ Create loop buttons
        loopButtonsContainer.innerHTML = ""; // Clear previous
        loopSegments.forEach((segment, index) => {
          const btn = document.createElement("button");
          btn.textContent = `Segment ${index + 1}`;
          btn.style.marginRight = "5px";
          btn.onclick = () => playFromLoopSegment(index); // 🔗 Hook
          loopButtonsContainer.appendChild(btn);
        });
      })
      .catch((err) => {
        console.error("songLoader.js: Failed to load loop segments for", prefix, err);
        loopButtonsContainer.innerHTML = "<p style='color:red;'>⚠️ No loops found</p>";
      });
  });
});
