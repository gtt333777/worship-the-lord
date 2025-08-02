// ✅ loopManager.js (FULL FILE, 94+ lines)

let loopData = [];
let activeButton = null;

function renderLoopButtons() {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = "";
  if (!loopData || loopData.length === 0) return;

  loopData.forEach((loop, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${index + 1}`;
    btn.style.margin = "3px";
    btn.style.padding = "4px 8px";
    btn.setAttribute("data-loop-index", index);
    btn.addEventListener("click", () => {
      playFromLoop(index);
      highlightButton(btn);
    });
    container.appendChild(btn);
  });
}

function highlightButton(button) {
  removeButtonHighlight();
  button.style.backgroundColor = "orange";
  activeButton = button;
}

function removeButtonHighlight() {
  if (activeButton) {
    activeButton.style.backgroundColor = "";
    activeButton = null;
  }
}

function playFromLoop(index) {
  if (!loopData || index >= loopData.length) return;
  const start = loopData[index].start;
  const end = loopData[index].end;

  if (window.vocalAudio && window.accompAudio) {
    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;
    vocalAudio.play();
    accompAudio.play();

    const stopPlayback = () => {
      if (vocalAudio.currentTime >= end || accompAudio.currentTime >= end) {
        vocalAudio.pause();
        accompAudio.pause();
        vocalAudio.removeEventListener("timeupdate", stopPlayback);
        accompAudio.removeEventListener("timeupdate", stopPlayback);
        removeButtonHighlight();
      }
    };

    vocalAudio.addEventListener("timeupdate", stopPlayback);
    accompAudio.addEventListener("timeupdate", stopPlayback);
  }
}

function setupLoopSegmentPlayback() {
  // Placeholder if needed for future listeners
}

function loadLoopDataForSong(songName) {
  const suffix = songName.split(".")[0];
  const loopUrl = `https://dl.dropboxusercontent.com/s/your_path/${suffix}_loops.json`; // Update this

  fetch(loopUrl)
    .then((res) => res.json())
    .then((data) => {
      loopData = data;
      renderLoopButtons();
    })
    .catch((err) => {
      console.warn("⚠️ Failed to load loop data:", err);
    });
}

// ✅ DOM injection-safe initialization
document.addEventListener("DOMContentLoaded", () => {
  const checkExist = setInterval(() => {
    const container = document.getElementById("loopButtonsContainer");
    if (!container) {
      console.warn("⏳ Waiting for loopButtonsContainer...");
      return;
    }
    clearInterval(checkExist);
    console.log("✅ loopButtonsContainer found");
    renderLoopButtons();
    setupLoopSegmentPlayback();
  }, 100);
});
