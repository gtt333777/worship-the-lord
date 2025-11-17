// ===============================================================
// lyricsViewer.js  —  Character-weighted timing + whole-line highlight
//  - Counts Tamil chars + spaces (ignores English labels like "1st time")
//  - Default: 1-line highlight (bold + yellow background)
//  - Clean, distraction-free (no fades, no glows)
//  - Auto-scroll positions current line 3 lines below top
// ===============================================================

// GLOBALS (easy-to-change)
window.lyricsData = null;              // original JSON
window._lyricsProcessed = null;       // processed per-segment metadata
window.currentSegIndex = -1;
window.currentLineIndex = -1;

// Highlight controls
// mode: "lines" (whole-line highlight) — reserved for future "chars" mode
window.highlightMode = "lines";
// number of lines to highlight overall (centered on current). For "lines" mode.
window.highlightLines = 1; // default 1 (only current line). change to 3 or 5 if needed

// Scroll control
let userIsScrolling = false;
let scrollCooldownTimer = null;
window.addEventListener("scroll", () => {
  userIsScrolling = true;
  if (scrollCooldownTimer) clearTimeout(scrollCooldownTimer);
  scrollCooldownTimer = setTimeout(() => { userIsScrolling = false; }, 5000);
});

// -------------------------
// Utility: Clean a Tamil line
// Keep Tamil letters and combining marks + spaces
// Remove English words, digits, punctuation
// -------------------------
function cleanTamilLine(line) {
  if (!line || typeof line !== 'string') return '';

  // Normalize whitespace
  line = line.trim();

  // Remove obvious English markers like "1st time", "2nd time", "tine" etc.
  // A simple approach: strip any trailing Latin letters/digits after two or more spaces or tab
  // But we will more robustly remove all characters outside Tamil unicode block and spaces

  // Tamil Unicode block: \u0B80 - \u0BFF
  // We'll allow Tamil chars and the common Tamil vowel signs/diacritics in that block.
  // Also allow regular space (\u0020) and NBSP just in case.

  const allowed = /[\u0B80-\u0BFF\u00A0\u0020]/g;
  const matches = line.match(allowed);
  if (!matches) return '';

  // Reconstruct cleaned string and collapse multiple spaces to single space
  let cleaned = matches.join('').replace(/\s+/g, ' ').trim();
  return cleaned;
}

// -------------------------
// Compute processed metadata for each segment
// Creates per-segment arrays: cleanedLines, charCounts, cumulativeCharBounds
// -------------------------
function processLyricsData(raw) {
  if (!raw || !Array.isArray(raw.tamilSegments)) return null;

  const processed = raw.tamilSegments.map(seg => {
    const cleanedLines = (seg.lyrics || []).map(l => cleanTamilLine(l));

    // Count characters: include spaces as requested
    const charCounts = cleanedLines.map(l => l.length);

    const totalChars = charCounts.reduce((s, v) => s + (v || 0), 0);

    // Build cumulative boundaries (startCharIndex inclusive, endCharIndex exclusive)
    // We'll index chars from 0..totalChars-1 across the segment
    const cumulative = []; // array of {start, end} per line
    let cursor = 0;
    for (let i = 0; i < charCounts.length; i++) {
      const c = charCounts[i] || 0;
      cumulative.push({ start: cursor, end: cursor + c });
      cursor += c;
    }

    return {
      start: seg.start,
      end: seg.end,
      duration: seg.end - seg.start,
      rawLines: seg.lyrics || [],
      cleanedLines,
      charCounts,
      totalChars,
      cumulative
    };
  });

  return processed;
}

// -------------------------
// 1. Load JSON lyrics (call this from outside as before)
// -------------------------
window.loadLyricsFromJSON = function (jsonData) {
  console.log('📘 Lyrics loaded:', jsonData);
  window.lyricsData = jsonData;
  window._lyricsProcessed = processLyricsData(jsonData);
  window.currentSegIndex = -1;
  window.currentLineIndex = -1;

  renderTamilLyrics();
  renderEnglishLyrics();
};

// -------------------------
// Render Tamil lyrics into the #tamilLyricsBox
// We'll create a clean DOM structure and also store element refs
// -------------------------
window.tamilRendered = []; // array of {segIndex, lineIndex, el}

function renderTamilLyrics() {
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;
  box.innerHTML = '';
  window.tamilRendered = [];

  if (!window.lyricsData || !window.lyricsData.tamilSegments) return;

  window.lyricsData.tamilSegments.forEach((seg, segIndex) => {
    const segDiv = document.createElement('div');
    segDiv.style.marginBottom = '16px';

    const title = document.createElement('div');
    title.textContent = `Segment ${segIndex + 1}`;
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    segDiv.appendChild(title);

    (seg.lyrics || []).forEach((line, lineIndex) => {
      const lineEl = document.createElement('div');
      lineEl.textContent = cleanTamilLine(line) || '\u00A0'; // non-empty so height keeps
      lineEl.style.padding = '4px 0';
      lineEl.style.transition = 'none'; // no visual transitions
      lineEl.style.whiteSpace = 'pre-wrap';
      lineEl.style.fontSize = '16px'; // ensure readable size — adjust as needed

      // default non-highlight styles
      lineEl.style.fontWeight = 'normal';
      lineEl.style.color = '#333';
      lineEl.style.background = 'transparent';

      window.tamilRendered.push({ segIndex, lineIndex, el: lineEl });
      segDiv.appendChild(lineEl);
    });

    box.appendChild(segDiv);
  });
}

// -------------------------
// Render English lyrics (simple)
// -------------------------
function renderEnglishLyrics() {
  const box = document.getElementById('englishLyricsBox');
  if (!box) return;
  box.innerHTML = '';
  if (!window.lyricsData || !window.lyricsData.englishLyrics) return;
  box.textContent = window.lyricsData.englishLyrics.join('\n');
}

// -------------------------
// Scroll helper: position element 3 lines below top
// -------------------------
function scrollToThreeLinesBelowTop(el) {
  if (!el) return;
  if (userIsScrolling) return; // respect manual scroll

  const rect = el.getBoundingClientRect();
  const lineHeight = 28; // approximate — adjust if needed in CSS
  const offset = lineHeight * 3; // 3 lines below top
  const targetTop = offset; // we want el.top to be this distance from viewport top
  const currentTop = rect.top;
  const scrollAmount = currentTop - targetTop;

  window.scrollBy({ top: scrollAmount, left: 0, behavior: 'smooth' });
}

// -------------------------
// Clear all highlights
// -------------------------
function clearAllHighlights() {
  window.tamilRendered.forEach(item => {
    item.el.style.background = 'transparent';
    item.el.style.fontWeight = 'normal';
    item.el.style.color = '#333';
  });
}

// -------------------------
// Apply highlight based on current seg & line
// Supports highlightLines centering logic
// -------------------------
function applyHighlight(segIndex, lineIndex) {
  if (segIndex === -1) {
    clearAllHighlights();
    return;
  }

  const half = Math.floor(window.highlightLines / 2);

  window.tamilRendered.forEach(item => {
    if (item.segIndex !== segIndex) {
      // different segment -> un-highlight
      item.el.style.background = 'transparent';
      item.el.style.fontWeight = 'normal';
      item.el.style.color = '#333';
      return;
    }

    const rel = item.lineIndex - lineIndex; // negative = above, 0 = current, positive = below
    const within = (window.highlightLines % 2 === 1)
      ? Math.abs(rel) <= half // symmetric around current when odd
      : (rel >= 0 && rel < window.highlightLines); // for even, highlight current + next (e.g., 2 => current + next)

    if (within) {
      // highlight style: bold + yellow background + black text
      item.el.style.background = 'rgba(255, 255, 0, 0.35)';
      item.el.style.fontWeight = 'bold';
      item.el.style.color = '#000';

      // scroll only for the current line (rel === 0)
      if (rel === 0) scrollToThreeLinesBelowTop(item.el);

    } else {
      // normal
      item.el.style.background = 'transparent';
      item.el.style.fontWeight = 'normal';
      item.el.style.color = '#333';
    }
  });
}

// -------------------------
// Update highlight using character-weighted timing (whole-line highlight)
// This is the replacement for your old per-line-even timing
// -------------------------
window.updateLyricsHighlight = function (currentTime) {
  if (!window._lyricsProcessed || !Array.isArray(window._lyricsProcessed)) return;

  const segments = window._lyricsProcessed;
  let segIndex = -1;

  for (let i = 0; i < segments.length; i++) {
    if (currentTime >= segments[i].start && currentTime <= segments[i].end) {
      segIndex = i;
      break;
    }
  }

  if (segIndex === -1) {
    clearAllHighlights();
    window.currentSegIndex = -1;
    window.currentLineIndex = -1;
    return;
  }

  const seg = segments[segIndex];
  const duration = seg.duration;
  const elapsed = currentTime - seg.start;

  // If segment has zero chars or zero duration, fallback to simple per-line division
  if (!seg.totalChars || seg.totalChars <= 0 || duration <= 0) {
    // fallback: equal per-line
    const numLines = (seg.cleanedLines || []).length || 1;
    const perLine = duration / numLines;
    let lineIndex = Math.floor(elapsed / perLine);
    if (lineIndex >= numLines) lineIndex = numLines - 1;

    window.currentSegIndex = segIndex;
  // APPLY MANUAL OFFSET
  const finalIndex = Math.max(0, Math.min(lineIndex + (window.manualOffset||0), numLines - 1));
  window.currentLineIndex = finalIndex;
  applyHighlight(segIndex, finalIndex);(segIndex, lineIndex);
    return;
  }

  // character-based calculation
  const perChar = duration / seg.totalChars; // seconds per character
  const charsElapsed = elapsed / perChar; // how many character positions into segment

  // find which line contains this character index (use cumulative bounds)
  let lineIndex = 0;
  for (let i = 0; i < seg.cumulative.length; i++) {
    const b = seg.cumulative[i];
    // treat empty lines (start===end) as skip
    if (b.start <= charsElapsed && charsElapsed < b.end) {
      lineIndex = i;
      break;
    }
    // if charsElapsed is beyond last char, clamp to last line
    if (i === seg.cumulative.length - 1 && charsElapsed >= b.end) {
      lineIndex = i;
      break;
    }
  }

  // safety clamp
  const numLines = seg.cumulative.length;
  if (lineIndex < 0) lineIndex = 0;
  if (lineIndex >= numLines) lineIndex = numLines - 1;

  // store and apply
  window.currentSegIndex = segIndex;
  window.currentLineIndex = lineIndex;
  applyHighlight(segIndex, lineIndex);
};

// -------------------------
// Manual offset globals
window.manualOffset = 0;

// Manual shift controls
window.highlightUp = function(){ window.manualOffset = (window.manualOffset||0) - 1; };
window.highlightDown = function(){ window.manualOffset = (window.manualOffset||0) + 1; };
window.highlightReset = function(){ window.manualOffset = 0; };

// Expose small API for runtime changes (safe)
// -------------------------
window.setHighlightLines = function (n) {
  const parsed = parseInt(n, 10) || 1;
  window.highlightLines = Math.max(1, parsed);
};

window.setHighlightMode = function (mode) {
  // only "lines" supported now — placeholder for future
  if (mode === 'lines' || mode === 'chars') window.highlightMode = mode;
};

// -------------------------
// Keyboard shortcuts (↑ ↓ R) — minimal mode
// -------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    highlightUp();
    showOffsetTooltip();
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    highlightDown();
    showOffsetTooltip();
    e.preventDefault();
  } else if (e.key.toLowerCase() === 'r') {
    highlightReset();
    showOffsetTooltip();
  }
});

// -------------------------
// Tooltip for manual offset (minimal, fades after 2 sec)
// -------------------------
let offsetTooltipEl = null;
let offsetTooltipTimer = null;

function showOffsetTooltip() {
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;

  // Create tooltip element if missing
  if (!offsetTooltipEl) {
    offsetTooltipEl = document.createElement('div');
    offsetTooltipEl.style.position = 'absolute';
    offsetTooltipEl.style.top = '4px';
    offsetTooltipEl.style.right = '8px';
    offsetTooltipEl.style.fontSize = '12px';
    offsetTooltipEl.style.color = '#555';
    offsetTooltipEl.style.background = 'rgba(255,255,255,0.7)';
    offsetTooltipEl.style.padding = '2px 6px';
    offsetTooltipEl.style.borderRadius = '4px';
    offsetTooltipEl.style.pointerEvents = 'none';
    offsetTooltipEl.style.transition = 'opacity 0.4s';
    offsetTooltipEl.style.opacity = '1';
    box.style.position = 'relative';
    box.appendChild(offsetTooltipEl);
  }

  // Update text
  const off = window.manualOffset || 0;
  offsetTooltipEl.textContent = off === 0 ? 'Offset: 0 (Sync)' : `Offset: ${off > 0 ? '+'+off : off}`;
  offsetTooltipEl.style.opacity = '1';

  // Fade out after 2 seconds
  if (offsetTooltipTimer) clearTimeout(offsetTooltipTimer);
  offsetTooltipTimer = setTimeout(() => {
    if (offsetTooltipEl) offsetTooltipEl.style.opacity = '0';
  }, 2000);
}

// -------------------------
// End of file
// -------------------------
