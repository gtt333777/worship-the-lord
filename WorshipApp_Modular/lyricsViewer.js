// ===============================================================
//  lyricsViewer.js  (FINAL — JSON BASED)
//  Renders:
//   ✔ Tamil timed segments (progressive highlight)
//   ✔ English plain text (no highlight)
//  Works with: lyrics/<songName>.json
// ===============================================================

// global storage
window.lyricsData = null;
window.tamilRendered = [];
window.currentSegIndex = -1;
window.currentLineIndex = -1;

// ===============================================================
// 1. Load JSON lyrics for a song
// Called from: songLoader.js  → loadLyricsFromJSON(jsonData);
// ===============================================================
window.loadLyricsFromJSON = function (jsonData) {
  console.log("📘 Lyrics loaded:", jsonData);

  window.lyricsData = jsonData;
  window.currentSegIndex = -1;
  window.currentLineIndex = -1;

  renderTamilLyrics();
  renderEnglishLyrics();
};

// ===============================================================
// 2. Render Tamil Lyrics (timed segments)
// ===============================================================
function renderTamilLyrics() {
  const box = document.getElementById("tamilLyricsBox");
  box.innerHTML = "";
  window.tamilRendered = [];

  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  window.lyricsData.tamilSegments.forEach((seg, segIndex) => {
    // segment wrapper
    const segDiv = document.createElement("div");
    segDiv.style.marginBottom = "16px";

    // header
    const title = document.createElement("div");
    title.textContent = `Segment ${segIndex + 1}`;
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    segDiv.appendChild(title);

    // lines inside the segment
    seg.lyrics.forEach((line, lineIndex) => {
      const lineEl = document.createElement("div");
      lineEl.textContent = line;
      lineEl.style.padding = "2px 0";

      // store reference for live highlight
      window.tamilRendered.push({
        segIndex,
        lineIndex,
        el: lineEl
      });

      segDiv.appendChild(lineEl);
    });

    box.appendChild(segDiv);
  });
}

// ===============================================================
// 3. Render English Lyrics (plain text only)
// ===============================================================
function renderEnglishLyrics() {
  const box = document.getElementById("englishLyricsBox");
  box.innerHTML = "";

  if (!window.lyricsData || !window.lyricsData.englishLyrics) return;

  // Simply show full English as plain text
  box.textContent = window.lyricsData.englishLyrics.join("\n");
}

// ===============================================================
// 4. Highlight Tamil line based on audio time
// Called from: songLoader.js and loopPlayer.js
// ===============================================================
window.updateLyricsHighlight = function (currentTime) {
  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  const segments = window.lyricsData.tamilSegments;

  // find the active segment
  let segIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    if (currentTime >= segments[i].start &&
        currentTime <= segments[i].end) {
      segIndex = i;
      break;
    }
  }

  // not in any tamil segment
  if (segIndex === -1) {
    clearAllHighlights();
    return;
  }

  const seg = segments[segIndex];
  const duration = seg.end - seg.start;
  const elapsed = currentTime - seg.start;

  const numLines = seg.lyrics.length;
  if (numLines === 0) return;

  const perLine = duration / numLines;

  let lineIndex = Math.floor(elapsed / perLine);
  if (lineIndex >= numLines) lineIndex = numLines - 1;

  applyHighlight(segIndex, lineIndex);
};

// ===============================================================
// Helper: Apply highlight
// ===============================================================
function applyHighlight(segIndex, lineIndex) {
  window.tamilRendered.forEach(item => {
    if (item.segIndex === segIndex && item.lineIndex === lineIndex) {
      item.el.style.background = "rgba(255, 255, 0, 0.35)";
    } else {
      item.el.style.background = "transparent";
    }
  });
}

// ===============================================================
// Helper: Clear highlight
// ===============================================================
function clearAllHighlights() {
  window.tamilRendered.forEach(item => {
    item.el.style.background = "transparent";
  });
}
