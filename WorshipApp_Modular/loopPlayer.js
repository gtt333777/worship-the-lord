console.log("loopPlayer.js: Starting...");

let segmentTimeout;
let progressInterval;

document.addEventListener("DOMContentLoaded", () => {
  checkReady(0);
});

function checkReady(attempts) {
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");
  const songSelect = document.getElementById("songSelect");

  if (!loopButtonsContainer || !songSelect) {
    if (attempts < 20) {
      setTimeout(() => checkReady(attempts + 1), 300);
    } else {
      console.warn("loopPlayer.js: Required elements not found.");
    }
    return;
  }

  console.log("loopPlayer.js: Using selected song name for test");
  const selectedTamilName = songSelect.value;
  const loopFilename = `lyrics/${selectedTamilName}_loops.json`;

  console.log("Trying to fetch loop file:", loopFilename);
  fetch(loopFilename)
    .then(response => {
      if (!response.ok) throw new Error("Loop file not found");
      return response.json();
    })
    .then(data => {
      console.log("✅ Loop file loaded:", data);
      setupSegmentButtons(data, loopButtonsContainer);
    })
    .catch(err => {
      console.warn("⚠️ No loop file found for this song. Error:", err.message);
      loopButtonsContainer.innerHTML = "// //";
    });
}

function setupSegmentButtons(segments, container) {
  container.innerHTML = "";
  segments.forEach((segment, index) => {
    // 🔹 Wrapper for each button + progress bar
    const wrapper = document.createElement("div");
    wrapper.className = "segmentButtonWrapper";
    wrapper.style.display = "inline-block";
    wrapper.style.position = "relative";
    wrapper.style.margin = "2px";

    // 🔹 Button
    const button = document.createElement("button");
    button.textContent = `Segment ${index + 1}`;
    button.dataset.index = index;
    button.className = "segmentButton";
    button.addEventListener("click", () => playSegment(index, segments));

    // 🔹 Vertical Progress Bar (hidden initially)
    const progressBar = document.createElement("div");
    progressBar.className = "progressBar";
    progressBar.style.position = "absolute";
    progressBar.style.left = "0";
    progressBar.style.top = "0";
    progressBar.style.width = "3px";
    progressBar.style.height = "0%";
    progressBar.style.backgroundColor = "blue";
    progressBar.style.display = "none";

    // 🔹 Assemble
    wrapper.appendChild(button);
    wrapper.appendChild(progressBar);
    container.appendChild(wrapper);
  });
}

function playSegment(index, segments) {
  const segment = segments[index];
  const vocalAudio = document.getElementById("vocalAudio");
  const accompAudio = document.getElementById("accompAudio");

  if (!vocalAudio || !accompAudio) {
    console.warn("🔇 Audio elements not found.");
    return;
  }

  console.log(`🎯 Segment ${index + 1}: ${segment.start} ➡ ${segment.end} (${(segment.end - segment.start).toFixed(2)}s)`);

  // ⛔ Clear any existing timeout or progress
  clearTimeout(segmentTimeout);
  clearInterval(progressInterval);
  document.querySelectorAll(".progressBar").forEach(bar => {
    bar.style.display = "none";
    bar.style.height = "0%";
  });

  // 🟦 Start current segment progress bar
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");
  const wrapper = loopButtonsContainer.children[index];
  const progressBar = wrapper.querySelector(".progressBar");
  progressBar.style.display = "block";

  const duration = segment.end - segment.start;

  progressInterval = setInterval(() => {
    const currentTime = vocalAudio.currentTime;
    const elapsed = currentTime - segment.start;
    const percent = Math.min((elapsed / duration) * 100, 100);
    progressBar.style.height = `${percent}%`;
    if (percent >= 100) {
      clearInterval(progressInterval);
    }
  }, 100);

  // ⏯ Start playback from segment
  vocalAudio.currentTime = segment.start;
  accompAudio.currentTime = segment.start;

  vocalAudio.play().catch(err => console.warn("🔴 Vocal play error:", err));
  accompAudio.play().catch(err => console.warn("🔴 Accomp play error:", err));

  console.log("▶️ Both audio tracks started.");

  segmentTimeout = setTimeout(() => {
    vocalAudio.pause();
    accompAudio.pause();
    console.log("⏹ Segment ended. Audio paused.");

    // 🔁 Clean progress bar
    clearInterval(progressInterval);
    progressBar.style.display = "none";
    progressBar.style.height = "0%";

  }, (segment.end - segment.start) * 1000);
}
