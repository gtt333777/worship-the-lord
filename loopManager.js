// loopManager.js
console.log("⚠️ loopManager.js: Starting");

function waitForLoopElementsAndInit(attempts = 0) {
  const songSelect = document.getElementById("songSelect");
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");

  if (songSelect && loopButtonsContainer) {
    console.log("✅ loopManager.js: #songSelect and #loopButtonsContainer found");
    initializeLoopManager(songSelect, loopButtonsContainer);
  } else {
    if (attempts > 20) {
      console.error("❌ loopManager.js: Failed to find required elements after 20 attempts.");
      return;
    }
    console.warn("⏳ loopManager.js: Waiting for #songSelect and #loopButtonsContainer...");
    setTimeout(() => waitForLoopElementsAndInit(attempts + 1), 300);
  }
}

function initializeLoopManager(songSelect, loopButtonsContainer) {
  console.log("✅ loopManager.js: Initializing loop buttons");

  loopButtonsContainer.innerHTML = ""; // Clear if any

  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${i}`;
    btn.style.marginRight = "5px";
    btn.addEventListener("click", () => {
      console.log(`▶️ User clicked Segment ${i}`);
      // Your loop playback logic here
    });
    loopButtonsContainer.appendChild(btn);
  }

  console.log("✅ loopManager.js: Segment buttons added");
}

// Start waiting for required elements
waitForLoopElementsAndInit();
