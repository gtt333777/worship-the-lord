let currentLoopIndex = null;
let loopButtons = [];
let loopsData = [];

document.addEventListener("DOMContentLoaded", () => {
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");
  if (!loopButtonsContainer) {
    console.warn("⚠️ loopButtonsContainer not found during DOMContentLoaded.");
    return;
  }

  window.displayLoopButtons = function (loops) {
    loopButtonsContainer.innerHTML = "";
    loopButtons = [];
    loopsData = loops;

    loops.forEach((loop, index) => {
      const button = document.createElement("button");
      button.textContent = `Segment ${index + 1}`;
      button.className = "loop-segment-button";
      button.style.margin = "2px";

      button.onclick = () => {
        playLoopSegment(index);
      };

      loopButtons.push(button);
      loopButtonsContainer.appendChild(button);
    });
  };

  function playLoopSegment(index) {
    if (!loopsData[index]) return;

    const loop = loopsData[index];
    const { start, end } = loop;

    if (currentLoopIndex !== null && currentLoopIndex !== index) {
      stopPlayback();
    }

    currentLoopIndex = index;

    if (!window.vocalAudio || !window.accompAudio) {
      console.error("❌ Audio elements not available.");
      return;
    }

    // Cancel any existing handlers
    vocalAudio.onended = null;
    accompAudio.onended = null;

    // Seek and play
    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    vocalAudio.play();
    accompAudio.play();

    // Stop at segment end
    const stopAt = () => {
      if (vocalAudio.currentTime >= end || accompAudio.currentTime >= end) {
        stopPlayback();
      } else {
        requestAnimationFrame(stopAt);
      }
    };
    requestAnimationFrame(stopAt);
  }

  function stopPlayback() {
    if (!window.vocalAudio || !window.accompAudio) return;
    vocalAudio.pause();
    accompAudio.pause();
    currentLoopIndex = null;
  }

  window.stopLoopPlayback = stopPlayback;
});
