console.log("🔁 loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");
  if (!loopButtonsDiv) {
    console.warn("loopPlayer.js: #loopButtonsContainer not found in DOM.");
    return;
  }

  // ✅ Step 1: Get selected song name from dropdown
  const selectedSongName = document.getElementById("songSelect")?.value;
  if (!selectedSongName) {
    console.warn("loopPlayer.js: No song selected in dropdown.");
    return;
  }

  console.log("🎵 loopPlayer.js: Using selected song name for loop file:", selectedSongName);

  // ✅ Step 2: Build JSON file path
  const loopFilePath = `lyrics/${selectedSongName}_loops.json`;
  console.log("📂 Trying to fetch loop file:", loopFilePath);

  // ✅ Step 3: Fetch the JSON loop file
  fetch(loopFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error("Loop JSON not found");
      }
      return response.json();
    })
    .then(data => {
      console.log(`✅ Loop data loaded: (${data.length})`, data);

      // ✅ Step 4: Create Segment Buttons
      loopButtonsDiv.innerHTML = ""; // Clear old buttons
      data.forEach((segment, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.style.margin = "5px";
        btn.onclick = () => playLoopFromIndex(data, index);
        loopButtonsDiv.appendChild(btn);
      });
    })
    .catch(err => {
      console.warn("❌ loopPlayer.js: No loop file found for", selectedSongName);
      console.error(err);
      loopButtonsDiv.innerHTML = ""; // Clear UI if not found
    });
});

// ✅ Loop playback logic
function playLoopFromIndex(data, startIndex) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("loopPlayer.js: Cannot play segment — audio elements not ready.");
    return;
  }

  let index = startIndex;
  const playNext = () => {
    if (index >= data.length) {
      console.log("🔚 Finished all loop segments.");
      vocalAudio.pause();
      accompAudio.pause();
      return;
    }

    const { start, end } = data[index];
    console.log(`🎯 Playing Segment ${index + 1}: ${start} → ${end}`);

    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    vocalAudio.play();
    accompAudio.play();

    setTimeout(() => {
      index++;
      playNext();
    }, (end - start) * 1000);
  };

  playNext();
}
