// ===============================================================
//  lyricsViewer.js
//  Renders:
//   ✔ Tamil timed segments (progressive highlight)
//   ✔ English plain text (no highlight)
//  Works with combined_song.json
// ===============================================================

window.lyricsData = null;  // combined JSON structure
window.currentSegIndex = -1;
window.currentLineIndex = -1;

// ===============================================================
// 1. Load combined JSON when song changes
// (You will call this from songLoader.js once JSON is fetched)
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
// 2. Render Tamil lyrics (timed)
// ===============================================================
function renderTamilLyrics() {

  const box = document.getElementById("tamilLyricsBox");
  box.innerHTML = "";

  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  window.tamilRendered = []; // store DOM elements for highlight

  window.lyricsData.tamilSegments.forEach((seg, segIndex) => {

    // Create segment wrapper
    const segDiv = document.createElement("div");
    segDiv.style.marginBottom = "12px";

    // Segment title
    const title = document.createElement("div");
    title.textContent = `Segment ${segIndex + 1}`;
    title.style.fontWeight = "bold";
    title.style.marginBottom = "4px";
    segDiv.appendChild(title);

    // Tamil lines
    seg.lyrics.forEach((line, lineIndex) => {
      const lineEl = document.createElement("div");
      lineEl.textContent = line;
      lineEl.style.padding = "2px 0";

      // store so we can highlight later
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
// 3. Render English lyrics (plain text)
// ===============================================================
function renderEnglishLyrics() {
  const box = document.getElementById("englishLyricsBox");
  box.innerHTML = "";

  if (!window.lyricsData || !window.lyricsData.englishLyrics) return;

  let out = "---- English Lyrics ----\n\n";
  out += window.lyricsData.englishLyrics.join("\n");

  box.textContent = out;
}


// ===============================================================
// 4. Highlight Tamil lines based on audio time
// ===============================================================

window.updateLyricsHighlight = function (currentTime) {

  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  const segments = window.lyricsData.tamilSegments;

  // 1) Find active segment
  let segIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    if (currentTime >= segments[i].start &&
        currentTime <= segments[i].end) {
      segIndex = i;
      break;
    }
  }

  if (segIndex === -1) {
    // clear highlight if outside Tamil
    clearAllHighlights();
    return;
  }

  const seg = segments[segIndex];
  const totalDur = seg.end - seg.start;
  const elapsed = currentTime - seg.start;

  const numLines = seg.lyrics.length;
  if (numLines === 0) return;

  // duration of each line
  const perLine = totalDur / numLines;

  // which line is active?
  let lineIndex = Math.floor(elapsed / perLine);
  if (lineIndex >= numLines) lineIndex = numLines - 1;

  applyHighlight(segIndex, lineIndex);
};


// ===============================================================
// Helper: apply highlight to correct line
// ===============================================================
function applyHighlight(segIndex, lineIndex) {

  window.tamilRendered.forEach(item => {
    if (item.segIndex === segIndex && item.lineIndex === lineIndex) {
      item.el.style.background = "rgba(255, 255, 0, 0.4)";
    } else {
      item.el.style.background = "transparent";
    }
  });
}


// ===============================================================
// Helper: clear highlight
// ===============================================================
function clearAllHighlights() {
  window.tamilRendered.forEach(item => {
    item.el.style.background = "transparent";
  });
}
