// loopManager.js
console.log("✅ loopManager.js: Starting");

function waitForLoopElementsAndInit(attempts = 0) {
  const songSelect = document.getElementById("songSelect");
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");

  if (songSelect && loopButtonsContainer) {
    console.log("✅ loopManager.js: Elements ready, attaching change handler");
    songSelect.addEventListener("change", () => {
      const songName = songSelect.value.trim();
      const jsonFile = `lyrics/${songName}_loops.json`;
      console.log(`📄 Fetching loops from ${jsonFile}`);
      fetch(jsonFile)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to load: ${jsonFile}`);
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            console.error("❌ Invalid JSON structure: expected array of segments");
            return;
          }
          console.log(`🔁 Loaded ${data.length} segment(s)`);
          renderLoopButtons(data);
        })
        .catch(err => {
          console.error("❌ Error loading loop JSON:", err);
          loopButtonsContainer.innerHTML = "<em>No segments found.</em>";
        });
    });
  } else {
    if (attempts > 20) {
      console.error("❌ loopManager.js: Elements not found after 20 attempts.");
      return;
    }
    setTimeout(() => waitForLoopElementsAndInit(attempts + 1), 300);
  }
}

function renderLoopButtons(segments) {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = ""; // Clear old buttons

  segments.forEach((segment, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${index + 1}`;
    btn.className = "loop-button";
    btn.addEventListener("click", () => {
      console.log(`▶️ Playing Segment ${index + 1}: ${segment.start}s to ${segment.end}s`);
      // Future: playSegment(segment.start, segment.end);
    });
    container.appendChild(btn);
  });
}

// Start process
waitForLoopElementsAndInit();
