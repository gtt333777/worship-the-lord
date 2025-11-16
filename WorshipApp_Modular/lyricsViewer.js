// ===============================================================
//  lyricsViewer.js  (FINAL — Smooth, Smart Scroll, Cooldown)
//  Renders:
//   ✔ Tamil timed segments (progressive highlight)
//   ✔ English plain text (no highlight)
//   ✔ Fade + Bold highlight
//   ✔ Smart auto-scroll (with cooldown + future-lines)
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

// detect user scroll (touch, drag, swipe, wheel)
window.addEventListener("scroll", () => {
  userIsScrolling = true;

  // reset timer if still scrolling
  if (scrollCooldownTimer) clearTimeout(scrollCooldownTimer);

  scrollCooldownTimer = setTimeout(() => {
    userIsScrolling = false;
  }, 5000); // 5 sec cooldown
});

// ===============================================================
// 1. Load JSON lyrics for a song
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
      lineEl.style.padding = "2px 0";
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
// 3. Render English Lyrics
// ===============================================================
function renderEnglishLyrics() {
  const box = document.getElementById("englishLyricsBox");
  box.innerHTML = "";

  if (!window.lyricsData || !window.lyricsData.englishLyrics) return;

  box.textContent = window.lyricsData.englishLyrics.join("\n");
}

// ===============================================================
// SMART AUTO-SCROLL FUNCTION
// ===============================================================
function smartScroll(el) {
  if (!el) return;

  // If user scrolled manually → do NOT auto-scroll
  if (userIsScrolling) return;

  const rect = el.getBoundingClientRect();
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;

  const bottomLimit = viewHeight * 0.85; // 85% of screen

  // CASE 1: Fully visible → do nothing
  if (rect.top >= 0 && rect.bottom <= viewHeight) {

    // BUT if it is too close to bottom → scroll slightly to show future lines
    if (rect.bottom > bottomLimit) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // CASE 2: Not visible → scroll to center
  el.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

// ===============================================================
// 4. Highlight Tamil line based on audio time
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

// ===============================================================
// Apply highlight + fade + bold + smart scroll
// ===============================================================
function applyHighlight(segIndex, lineIndex) {
  window.tamilRendered.forEach(item => {
    if (item.segIndex === segIndex && item.lineIndex === lineIndex) {
      item.el.style.background = "rgba(255, 255, 0, 0.35)";
      item.el.style.fontWeight = "bold";
      item.el.style.color = "#000";

      // SMART SCROLL HERE
      smartScroll(item.el);

    } else {
      item.el.style.background = "transparent";
      item.el.style.fontWeight = "normal";
      item.el.style.color = "#333";
    }
  });
}

// ===============================================================
// Clear highlight
// ===============================================================
function clearAllHighlights() {
  window.tamilRendered.forEach(item => {
    item.el.style.background = "transparent";
    item.el.style.fontWeight = "normal";
    item.el.style.color = "#333";
  });
}
