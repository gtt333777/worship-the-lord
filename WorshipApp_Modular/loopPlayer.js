console.log("🔁 loopPlayer.js: Ready...");

document.addEventListener("DOMContentLoaded", () => {
  const songSelect = document.getElementById("songSelect");
  if (!songSelect) {
    console.warn("loopPlayer.js: #songSelect not found in DOM.");
    return;
  }

  songSelect.addEventListener("change", () => {
    const selectedSongName = songSelect.value;
    if (!selectedSongName) {
      console.warn("loopPlayer.js: No song selected in dropdown.");
      return;
    }

    console.log("🎵 loopPlayer.js: Song selected →", selectedSongName);
    fetchAndRenderLoopButtons(selectedSongName);
  });
});

function fetchAndRenderLoopButtons(selectedSongName) {
  const loopButtonsDiv = document.getElementById("loopButtonsContainer");
  if (!loopButtonsDiv) {
    console.warn("loopPlayer.js: #loopButtonsContainer not found in DOM.");
    return;
  }

  const loopFilePath = `lyrics/${selectedSongName}_loops.json`;
  console.log("📂 Fetching:", loopFilePath);

  fetch(loopFilePath)
    .then(response => {
      if (!response.ok) throw new Error("Loop JSON not found");
      return response.json();
    })
    .then(data => {
      console.log(`✅ Loaded (${data.length}) segments:`, data);
      loopButtonsDiv.innerHTML = "";
      data.forEach((segment, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.onclick = () => playLoopFromIndex(data, index);
        loopButtonsDiv.appendChild(btn);
      });
    })
    .catch(err => {
      console.warn("❌ No loop file for", selectedSongName);
      console.error(err);
      loopButtonsDiv.innerHTML = "";
    });
}

function playLoopFromIndex(data, startIndex) {
  if (!window.vocalAudio || !window.accompAudio) {
    console.warn("loopPlayer.js: Audio not ready.");
    return;
  }

  let index = startIndex;
  const playNext = () => {
    if (index >= data.length) {
      vocalAudio.pause();
      accompAudio.pause();
      return;
    }

    const { start, end } = data[index];
    console.log(`🎯 Segment ${index + 1}: ${start} → ${end}`);
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
