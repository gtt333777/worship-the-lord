// loopPlayer.js
console.log("loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  const MAX_ATTEMPTS = 20;
  let checkCount = 0;
  let segmentTimeout = null;
  let currentlyPlaying = false;
  let progressInterval = null;

  function getSongPrefixFromDropdown() {
    const dropdown = document.getElementById("songSelect");
    if (!dropdown) return null;
    const selectedTamilName = dropdown.value.trim();
    const files = window.availableLyricsFiles || [];
    for (const filename of files) {
      if (filename.endsWith(".txt") && selectedTamilName && filename.includes(selectedTamilName)) {
        return filename.replace(".txt", "");
      }
    }
    return null;
  }

  function checkReadyAndLoadSegments() {
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;

    if (!vocalAudio || !accompAudio) {
      checkCount++;
      if (checkCount < MAX_ATTEMPTS) {
        console.warn("loopPlayer.js: Waiting for audio elements... Attempt", checkCount);
        return setTimeout(checkReadyAndLoadSegments, 500);
      } else {
        console.error("loopPlayer.js: ❌ Failed to find audio elements.");
        return;
      }
    }

    const prefix = getSongPrefixFromDropdown();
    if (!prefix) {
      console.warn("loopPlayer.js: ❌ Could not determine song prefix.");
      return;
    }

    const loopJsonPath = `lyrics/${prefix}_loops.json`;
    console.log("loopPlayer.js: 🎯 Fetching", loopJsonPath);

    fetch(loopJsonPath)
      .then((res) => res.json())
      .then((segments) => {
        console.log("loopPlayer.js: ✅ Loops loaded:", segments);
        renderSegmentButtons(segments, vocalAudio, accompAudio);
      })
      .catch((err) => console.error("loopPlayer.js: ❌ Failed to load _loops.json", err));
  }

  function renderSegmentButtons(segments, vocalAudio, accompAudio) {
    const container = document.getElementById("loopButtonsContainer");
    if (!container) return console.error("loopPlayer.js: ❌ loopButtonsContainer not found.");

    container.innerHTML = ""; // clear previous

    segments.forEach((seg, index) => {
      const btn = document.createElement("button");
      btn.textContent = `Segment ${index + 1}`;
      btn.style.marginRight = "10px";
      btn.style.position = "relative";
      btn.classList.add("segment-button");

      const bar = document.createElement("div");
      bar.className = "progress-bar";
      bar.style.position = "absolute";
      bar.style.left = "0";
      bar.style.top = "0";
      bar.style.bottom = "0";
      bar.style.width = "2px";
      bar.style.background = "lime";
      bar.style.display = "none";

      btn.appendChild(bar);

      btn.addEventListener("click", () => {
        if (segmentTimeout) clearTimeout(segmentTimeout);
        if (progressInterval) clearInterval(progressInterval);

        const { start, end } = seg;
        vocalAudio.currentTime = start;
        accompAudio.currentTime = start;
        vocalAudio.play();
        accompAudio.play();
        currentlyPlaying = true;

        document.querySelectorAll(".progress-bar").forEach(p => p.style.display = "none");
        bar.style.display = "block";

        const duration = end - start;
        const buttonWidth = btn.offsetWidth;

        progressInterval = setInterval(() => {
          const elapsed = vocalAudio.currentTime - start;
          const percent = Math.min(elapsed / duration, 1);
          bar.style.left = `${percent * buttonWidth}px`;
        }, 100);

        segmentTimeout = setTimeout(() => {
          vocalAudio.pause();
          accompAudio.pause();
          currentlyPlaying = false;
          clearInterval(progressInterval);
          bar.style.display = "none";
        }, (end - start) * 1000);
      });

      container.appendChild(btn);
    });
  }

  checkReadyAndLoadSegments();
});
