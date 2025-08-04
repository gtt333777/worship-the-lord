// loopManager.js
console.log("⚠️ loopManager.js: Starting");

function waitForLoopElementsAndInit(attempts = 0) {
  const songSelect = document.getElementById("songSelect");
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");

  if (songSelect && loopButtonsContainer) {
    console.log("✅ loopManager.js: #songSelect and #loopButtonsContainer found");
    songSelect.addEventListener("change", () => {
      const selectedSong = songSelect.value;
      renderLoopButtonsForSong(selectedSong, loopButtonsContainer);
    });

    // Load initial song's loops too (on refresh)
    if (songSelect.value) {
      renderLoopButtonsForSong(songSelect.value, loopButtonsContainer);
    }
  } else {
    if (attempts > 20) {
      console.error("❌ loopManager.js: Failed to find required elements after 20 attempts.");
      return;
    }
    console.warn("⏳ loopManager.js: Waiting for #songSelect and #loopButtonsContainer...");
    setTimeout(() => waitForLoopElementsAndInit(attempts + 1), 300);
  }
}

function getSuffixForSongName(tamilName) {
  if (!window.songNameSuffixMap) {
    console.error("❌ loopManager.js: songNameSuffixMap not found");
    return null;
  }
  return window.songNameSuffixMap[tamilName] || null;
}

function renderLoopButtonsForSong(tamilSongName, container) {
  container.innerHTML = ""; // clear old
  const suffix = getSuffixForSongName(tamilSongName);
  if (!suffix) {
    console.warn("⚠️ loopManager.js: No suffix for selected song:", tamilSongName);
    return;
  }

  const loopFileUrl = `lyrics/${suffix}_loops.json`;
  fetch(loopFileUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Loop file not found");
      return res.json();
    })
    .then((loopData) => {
      if (!Array.isArray(loopData) || loopData.length === 0) {
        container.innerHTML = "<span style='color:red'>No loops found.</span>";
        return;
      }

      loopData.forEach((loop, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.style.marginRight = "5px";
        btn.addEventListener("click", () => {
          console.log(`▶️ User clicked Segment ${index + 1}`);
          // TODO: Loop playback logic
        });
        container.appendChild(btn);
      });

      console.log(`✅ loopManager.js: Rendered ${loopData.length} loop segments`);
    })
    .catch((err) => {
      console.warn("⚠️ loopManager.js: Could not load loops:", err.message);
      container.innerHTML = "<span style='color:red'>No loops found.</span>";
    });
}

waitForLoopElementsAndInit();
