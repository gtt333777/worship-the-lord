// loopPlayer.js
console.log("loopPlayer.js: Starting...");

let segmentTimeout = null;
let progressAnimationFrame = null;
let currentlyPlaying = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("loopPlayer.js: DOMContentLoaded");

  const checkReady = () => {
    const select = document.getElementById("songSelect");
    const container = document.getElementById("loopButtonsContainer");
    const vocalAudio = window.vocalAudio;
    const accompAudio = window.accompAudio;

    if (!select || !container || !vocalAudio || !accompAudio) {
      console.warn("loopPlayer.js: Waiting for elements...");
      if (checkReady.attempts++ < 20) setTimeout(checkReady, 300);
      return;
    }

    const songName = select.value.trim();
    if (!songName) {
      console.warn("loopPlayer.js: No song selected");
      return;
    }

    const loopFile = `lyrics/${songName}_loops.json`;
    console.log("loopPlayer.js: Trying to fetch loop file:", loopFile);

    fetch(loopFile)
      .then(res => {
        if (!res.ok) throw new Error("Loop file not found");
        return res.json();
      })
      .then(segments => {
        console.log("loopPlayer.js: Loop file loaded ✅", segments);
        renderSegments(segments, vocalAudio, accompAudio, container);
      })
      .catch(err => {
        console.warn("loopPlayer.js: No loop file found for this song. Error:", err.message);
        container.innerHTML = "";
      });
  };

  checkReady.attempts = 0;
  checkReady();
});

function renderSegments(segments, vocalAudio, accompAudio, container) {
  container.innerHTML = "";

  segments.forEach((segment, i) => {
    const button = document.createElement("button");
    button.textContent = `Segment ${i + 1}`;
    button.style.position = "relative";
    button.classList.add("segmentButton");

    // Progress bar
    const bar = document.createElement("div");
    bar.className = "progressBar";
    bar.style.position = "absolute";
    bar.style.left = "50%";
    bar.style.top = "0";
    bar.style.bottom = "0";
    bar.style.width = "4px";
    bar.style.backgroundColor = "limegreen";
    bar.style.display = "none";
    bar.style.transform = "translateX(-50%)";
    button.appendChild(bar);

    button.addEventListener("click", () => {
      if (segmentTimeout) clearTimeout(segmentTimeout);
      if (progressAnimationFrame) cancelAnimationFrame(progressAnimationFrame);

      vocalAudio.pause();
      accompAudio.pause();
      currentlyPlaying = false;

      const { start, end } = segment;

      vocalAudio.currentTime = start;
      accompAudio.currentTime = start;

      vocalAudio.play();
      accompAudio.play();
      currentlyPlaying = true;

      // Reset all other bars
      document.querySelectorAll(".progressBar").forEach(pb => pb.style.display = "none");
      bar.style.display = "block";

      const updateBar = () => {
        const elapsed = vocalAudio.currentTime - start;
        const duration = end - start;
        const percent = Math.max(0, Math.min(100, (elapsed / duration) * 100));
        bar.style.height = `${percent}%`;

        if (vocalAudio.currentTime < end && currentlyPlaying) {
          progressAnimationFrame = requestAnimationFrame(updateBar);
        }
      };

      updateBar();

      segmentTimeout = setTimeout(() => {
        vocalAudio.pause();
        accompAudio.pause();
        currentlyPlaying = false;
        bar.style.display = "none";
      }, (end - start) * 1000);
    });

    container.appendChild(button);
  });
}
