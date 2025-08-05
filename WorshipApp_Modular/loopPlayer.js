// WorshipApp_Modular/loopPlayer.js
console.log("🔁 loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("🔁 loopPlayer.js: DOMContentLoaded");

  const checkReady = () => {
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;
    const currentSongName = window.currentSongName;

    if (!vocalAudio || !accompAudio || !currentSongName) {
      console.log("🔁 loopPlayer.js: Waiting for vocalAudio, accompAudio, currentSongName...");
      setTimeout(checkReady, 300);
      return;
    }

    const prefix = currentSongName.trim(); // Already the prefix, like "panipola"
    const loopJsonUrl = `lyrics/${prefix}_loops.json`;

    console.log(`🔁 loopPlayer.js: Trying to fetch ${loopJsonUrl}...`);

    fetch(loopJsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("🔁 loopPlayer.js: Loaded loops JSON ✅", data);
        setupSegmentButtons(data, vocalAudio, accompAudio);
      })
      .catch((err) => {
        console.warn("🔁 loopPlayer.js: No loop file found or error loading:", err.message);
      });
  };

  function setupSegmentButtons(segments, vocalAudio, accompAudio) {
    const container = document.getElementById("loopButtonsContainer");
    if (!container) return;

    container.innerHTML = ""; // Clear any previous buttons

    segments.forEach((segment, index) => {
      const btn = document.createElement("button");
      btn.textContent = `Segment ${index + 1}`;
      btn.style.margin = "5px";
      btn.onclick = () => playSegments(segments, index, vocalAudio, accompAudio);
      container.appendChild(btn);
    });

    console.log("🔁 loopPlayer.js: Segment buttons added.");
  }

  function playSegments(segments, startIndex, vocalAudio, accompAudio) {
    let currentIndex = startIndex;

    function playNext() {
      if (currentIndex >= segments.length) {
        vocalAudio.pause();
        accompAudio.pause();
        console.log("🔁 loopPlayer.js: All segments finished.");
        return;
      }

      const segment = segments[currentIndex];
      console.log(`🔁 Playing Segment ${currentIndex + 1}: ${segment.start}s to ${segment.end}s`);

      vocalAudio.currentTime = segment.start;
      accompAudio.currentTime = segment.start;

      vocalAudio.play();
      accompAudio.play();

      const duration = (segment.end - segment.start) * 1000;

      setTimeout(() => {
        currentIndex++;
        playNext();
      }, duration);
    }

    playNext();
  }

  checkReady();
});
