// ===============================================================
//  lyricsViewer.js  (FINAL — 3-lines-from-top + Two-line highlight)
// ===============================================================

// global storage
window.lyricsData = null;
window.tamilRendered = [];
window.currentSegIndex = -1;
window.currentLineIndex = -1;

// ===============================================================
// MANUAL SCROLL COOLDOWN (5 seconds)
// ===============================================================
let userIsScrolling = false;
let scrollCooldownTimer = null;

window.addEventListener("scroll", () => {
  userIsScrolling = true;

  if (scrollCooldownTimer) clearTimeout(scrollCooldownTimer);

  scrollCooldownTimer = setTimeout(() => {
    userIsScrolling = false;
  }, 5000);
});

// ===============================================================
// 1. Load JSON lyrics
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
// 2. Render Tamil lyrics
// ===============================================================
function renderTamilLyrics() {
  const box = document.getElementById("tamilLyricsBox");
  box.innerHTML = "";
  window.tamilRendered = [];

  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  window.lyricsData.tamilSegments.forEach((seg, segIndex) => {
    const segDiv = document.createElement("div");
    segDiv.style.marginBottom = "16px";

    const title = document.createElement("div");
    title.textContent = `Segment ${segIndex + 1}`;
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    segDiv.appendChild(title);

    seg.lyrics.forEach((line, lineIndex) => {
      const lineEl = document.createElement("div");
      lineEl.textContent = line;
      lineEl.style.padding = "4px 0";
      lineEl.classList.add("highlight-fade");

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
// 3. Render English
// ===============================================================
function renderEnglishLyrics() {
  const box = document.getElementById("englishLyricsBox");
  box.innerHTML = "";

  if (!window.lyricsData || !window.lyricsData.englishLyrics) return;

  box.textContent = window.lyricsData.englishLyrics.join("\n");
}

// ===============================================================
// POSITION HIGHLIGHTED LINE 3 LINES BELOW TOP
// ===============================================================
function scrollToThreeLinesBelowTop(el) {
  if (!el) return;

  // respect manual scroll cooldown
  if (userIsScrolling) return;

  const rect = el.getBoundingClientRect();
  const lineHeight = 28; // approximate (adjust if needed)
  const offset = lineHeight * 3; // 3 lines

  // Move highlighted line to this position:
  // top of screen + 3 line heights
  const targetTop = offset;

  const currentTop = rect.top;

  const scrollAmount = currentTop - targetTop;

  window.scrollBy({
    top: scrollAmount,
    left: 0,
    behavior: "smooth"
  });
}

// ===============================================================
// 4. Highlight based on audio time
// ===============================================================
window.updateLyricsHighlight = function (currentTime) {
  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  const segments = window.lyricsData.tamilSegments;
  let segIndex = -1;

  for (let i = 0; i < segments.length; i++) {
    if (currentTime >= segments[i].start &&
        currentTime <= segments[i].end) {
      segIndex = i;
      break;
    }
  }

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


/*
// ===============================================================
// 5. Two-line highlight + scrolling
// ===============================================================
function applyHighlight(segIndex, lineIndex) {
  window.tamilRendered.forEach(item => {
    const isCurrent = (item.segIndex === segIndex && item.lineIndex === lineIndex);
    const isNext = (item.segIndex === segIndex && item.lineIndex === lineIndex + 1);

    if (isCurrent || isNext) {
      item.el.style.background = "rgba(255, 255, 0, 0.35)";
      item.el.style.fontWeight = "bold";
      item.el.style.color = "#000";

      // Only scroll on CURRENT line (not next line)
      if (isCurrent) {
        scrollToThreeLinesBelowTop(item.el);
      }

    } else {
      item.el.style.background = "transparent";
      item.el.style.fontWeight = "normal";
      item.el.style.color = "#333";
    }
  });
}
*/

// ===============================================================
// 5. THREE-line highlight + scrolling (previous, current, next)
// ===============================================================
function applyHighlight(segIndex, lineIndex) {

  window.tamilRendered.forEach(item => {

    const isPrev = (item.segIndex === segIndex && item.lineIndex === lineIndex - 1);
    const isCurrent = (item.segIndex === segIndex && item.lineIndex === lineIndex);
    const isNext = (item.segIndex === segIndex && item.lineIndex === lineIndex + 1);

    if (isPrev || isCurrent || isNext) {
      // SAME styling as before (no distraction)
      item.el.style.background = "rgba(255, 255, 0, 0.35)";
      item.el.style.fontWeight = "bold";
      item.el.style.color = "#000";

      // Only scroll on the CURRENT line (middle one)
      if (isCurrent) {
        scrollToThreeLinesBelowTop(item.el);
      }

    } else {
      // non-highlight lines
      item.el.style.background = "transparent";
      item.el.style.fontWeight = "normal";
      item.el.style.color = "#333";
    }
  });
}




// ===============================================================
// 6. Clear highlight
// ===============================================================
function clearAllHighlights() {
  window.tamilRendered.forEach(item => {
    item.el.style.background = "transparent";
    item.el.style.fontWeight = "normal";
    item.el.style.color = "#333";
  });
}
