// loopManager.js
console.log("⚠️ loopManager.js: Starting");

let currentLoops = [];

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
  songSelect.addEventListener("change", () => {
    const selectedSong = songSelect.value.trim();
    const prefix = getPrefixFromSongName(selectedSong);
    fetchAndDisplayLoops(prefix, loopButtonsContainer);
  });

  // Trigger immediately on load
  const initialPrefix = getPrefixFromSongName(songSelect.value.trim());
  fetchAndDisplayLoops(initialPrefix, loopButtonsContainer);
}

function getPrefixFromSongName(songName) {
  const dropdown = document.getElementById("songSelect");
  const options = dropdown ? Array.from(dropdown.options) : [];
  const index = options.findIndex(opt => opt.value === songName);
  return index >= 0 ? `song${index + 1}` : "";
}

function fetchAndDisplayLoops(prefix, loopButtonsContainer) {
  const loopUrl = `https://content.dropboxapi.com/2/files/download`;
  const jsonPath = `/WorshipSongs/${prefix}_loops.json`;

  loopButtonsContainer.innerHTML = "⏳ Loading loops...";

  fetch("/.netlify/functions/getDropboxToken")
    .then(res => res.json())
    .then(tokenData => {
      return fetch(loopUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "Dropbox-API-Arg": JSON.stringify({ path: jsonPath })
        }
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Loop file not found");
      }
      return response.json();
    })
    .then(loopData => {
      currentLoops = loopData;
      renderLoopButtons(loopData, loopButtonsContainer);
    })
    .catch(err => {
      console.warn("⚠️ loopManager.js: Could not load loops:", err.message);
      loopButtonsContainer.innerHTML = `<span style="color: red;">No loops found.</span>`;
    });
}

function renderLoopButtons(loopData, loopButtonsContainer) {
  loopButtonsContainer.innerHTML = ""; // Clear old buttons

  if (!Array.isArray(loopData) || loopData.length === 0) {
    loopButtonsContainer.innerHTML = `<span style="color: red;">No segments available.</span>`;
    return;
  }

  loopData.forEach((segment, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${index + 1}`;
    btn.style.marginRight = "5px";
    btn.addEventListener("click", () => {
      console.log(`▶️ User clicked Segment ${index + 1}`);
      playFromSegment(index);
    });
    loopButtonsContainer.appendChild(btn);
  });

  console.log(`✅ loopManager.js: Displayed ${loopData.length} segment button(s)`);
}

function playFromSegment(startIndex) {
  if (!currentLoops.length) return;

  const segment = currentLoops[startIndex];
  if (!segment) return;

  // Assuming global audio elements exist
  if (window.vocalAudio && window.accompAudio) {
    vocalAudio.currentTime = segment.start;
    accompAudio.currentTime = segment.start;

    vocalAudio.play();
    accompAudio.play();

    // Optionally handle stop at end of last loop
  }
}

// Start
waitForLoopElementsAndInit();
