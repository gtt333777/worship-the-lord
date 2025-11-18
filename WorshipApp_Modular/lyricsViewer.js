// ===============================================================
// lyricsViewer.js  —  Character-weighted timing + whole-line highlight
//  - Auto-split by characters (adaptive) — high accuracy
//  - Counts Tamil chars + spaces (ignores English labels like "1st time")
//  - Default: 1-line highlight (bold + yellow background)
//  - Clean, distraction-free (no fades, no glows)
//  - Auto-scroll positions current line 3 lines below top
// ===============================================================

// --------- PUBLIC / GLOBALS (easy-to-change / exposed) ----------
window.lyricsData = null;              // original JSON
window._lyricsProcessed = null;       // processed per-segment metadata
window.currentSegIndex = -1;
window.currentLineIndex = -1;

// Highlight controls
window.highlightMode = "lines"; // reserved for future "chars" mode
window.highlightLines = 1; // default 1 (only current line). change to 3 or 5 if needed

// Manual offset globals (unchanged behavior)
window.manualOffset = 0;

// Tunables for auto-split (Gold-standard defaults)
let targetCharsPerSplit = 20;   // smaller -> finer splits -> more accuracy (default tuned for your long segments)
let maxPartsLimit = 16;         // safe hard cap to avoid too many parts

// Expose tunables for runtime experimentation
window.setTargetCharsPerSplit = function(n){
  const v = parseInt(n, 10);
  if (!isNaN(v) && v > 0) targetCharsPerSplit = v;
};
window.setMaxPartsLimit = function(n){
  const v = parseInt(n, 10);
  if (!isNaN(v) && v > 0) maxPartsLimit = v;
};

// Scroll control (preserve existing)
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

  // Allow Tamil block \u0B80-\u0BFF and normal space and NBSP
  const allowed = /[\u0B80-\u0BFF\u00A0\u0020]/g;
  const matches = line.match(allowed);
  if (!matches) return '';

  // Reconstruct cleaned string and collapse multiple spaces to single space
  let cleaned = matches.join('').replace(/\s+/g, ' ').trim();
  return cleaned;
}

// -------------------------
// Compute processed metadata for each segment (enhanced: auto-split by chars)
// Creates per-segment arrays: cleanedLines, charCounts, cumulativeCharBounds, parts
// -------------------------
function processLyricsData(raw) {
  if (!raw || !Array.isArray(raw.tamilSegments)) return null;

  const processed = raw.tamilSegments.map(seg => {
    const cleanedLines = (seg.lyrics || []).map(l => cleanTamilLine(l));
    const charCounts = cleanedLines.map(l => l.length || 0);
    const totalChars = charCounts.reduce((s, v) => s + (v || 0), 0);
    const duration = (typeof seg.end === 'number' && typeof seg.start === 'number') ? (seg.end - seg.start) : 0;

    // Build cumulative boundaries (startCharIndex inclusive, endCharIndex exclusive)
    const cumulative = [];
    let cursor = 0;
    for (let i = 0; i < charCounts.length; i++) {
      const c = charCounts[i] || 0;
      cumulative.push({ start: cursor, end: cursor + c });
      cursor += c;
    }

    // --- AUTO-SPLIT LOGIC (adaptive by totalChars) ---
    let parts = [];
    if (totalChars <= 0 || duration <= 0) {
      // fallback: single part equal to whole segment
      parts = [{
        index: 0,
        charStart: 0,
        charEnd: Math.max(0, totalChars),
        charsInPart: Math.max(0, totalChars),
        timeStart: seg.start,
        timeEnd: seg.end,
        duration: duration,
        perChar: (totalChars > 0) ? (duration / totalChars) : duration // fallback
      }];
    } else {
      // Decide how many parts based on totalChars
      let partsCount = Math.ceil(totalChars / targetCharsPerSplit);
      partsCount = Math.max(1, Math.min(partsCount, Math.min(maxPartsLimit, totalChars))); // clamp to sensible limits

      const durationPart = duration / partsCount;

      // Determine char index ranges per part by evenly slicing the global char index range.
      // This evenly assigns *character-index ranges* across parts; each time window is equal-duration.
      for (let i = 0; i < partsCount; i++) {
        const cs = Math.floor(totalChars * i / partsCount);
        const ce = (i === partsCount - 1) ? totalChars : Math.floor(totalChars * (i + 1) / partsCount);
        const charsInPart = Math.max(0, ce - cs);

        const tStart = seg.start + i * durationPart;
        const tEnd = seg.start + (i + 1) * durationPart;
        const perChar = (charsInPart > 0) ? (durationPart / charsInPart) : durationPart; // if zero chars, fallback

        parts.push({
          index: i,
          charStart: cs,
          charEnd: ce,
          charsInPart,
          timeStart: tStart,
          timeEnd: tEnd,
          duration: durationPart,
          perChar
        });
      }
    }

    return {
      start: seg.start,
      end: seg.end,
      duration,
      rawLines: seg.lyrics || [],
      cleanedLines,
      charCounts,
      totalChars,
      cumulative,
      parts
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
  window.manualOffset = 0;

  renderTamilLyrics();
  insertAdjustButtons();
  renderEnglishLyrics();
};

// -------------------------
// Insert buttons (▲ ▼ ⟳) at bottom-right (minimal bar)
// -------------------------
function insertAdjustButtons(){
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;

  // remove old bar if any
  const old = document.getElementById('lyricsAdjustButtons');
  if (old) old.remove();

  // IMPORTANT: container must be flex/column for sticky alignment
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.position = 'relative';

  const btnBar = document.createElement('div');
  btnBar.id = 'lyricsAdjustButtons';

  // ⭐ Magic combination — always visible at bottom-right
  btnBar.style.position = 'sticky';
  btnBar.style.bottom = '4px';
  btnBar.style.alignSelf = 'flex-end';

  btnBar.style.display = 'flex';
  btnBar.style.gap = '4px';
  btnBar.style.zIndex = '9999';

  btnBar.style.background = 'rgba(255,255,255,0.9)';
  btnBar.style.padding = '3px 4px';
  btnBar.style.border = '1px solid #ccc';
  btnBar.style.borderRadius = '6px';
  btnBar.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)';

  function makeBtn(label, handler){
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.fontSize = '12px';
    b.style.padding = '2px 6px';
    b.style.border = '1px solid #bbb';
    b.style.borderRadius = '4px';
    b.style.background = 'white';
    b.style.cursor = 'pointer';
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });
    return b;
  }

  btnBar.appendChild(makeBtn('▲', () => { highlightUp(); showOffsetTooltip(); }));
  btnBar.appendChild(makeBtn('▼', () => { highlightDown(); showOffsetTooltip(); }));
  btnBar.appendChild(makeBtn('⟳', () => { highlightReset(); showOffsetTooltip(); }));

  box.appendChild(btnBar);
}

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
// Update highlight using multi-part character-weighted timing (auto-split by chars)
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

    // APPLY MANUAL OFFSET
    const finalIndex = Math.max(0, Math.min(lineIndex + (window.manualOffset||0), numLines - 1));
    window.currentSegIndex = segIndex;
    window.currentLineIndex = finalIndex;
    applyHighlight(segIndex, finalIndex);
    return;
  }

  // Multi-part approach
  const parts = seg.parts && seg.parts.length ? seg.parts : [{ index: 0, timeStart: seg.start, timeEnd: seg.end, duration: seg.duration, charStart: 0, charEnd: seg.totalChars, charsInPart: seg.totalChars, perChar: seg.duration / seg.totalChars }];

  // determine part index by elapsed time (falls into equal-duration windows)
  let partIndex = Math.floor(elapsed / (parts[0].duration || seg.duration));
  if (partIndex < 0) partIndex = 0;
  if (partIndex >= parts.length) partIndex = parts.length - 1;

  const part = parts[partIndex];
  // elapsedWithinPart = currentTime - part.timeStart (more robust for floating point)
  const elapsedWithinPart = currentTime - part.timeStart;

  // avoid division by zero
  let charsElapsedWithinPart;
  if (part.charsInPart > 0) {
    charsElapsedWithinPart = elapsedWithinPart / part.perChar;
  } else {
    // If this part has zero characters, push to start of next part (or clamp)
    charsElapsedWithinPart = 0;
  }

  // compute global character index inside the segment
  let globalCharIndex = part.charStart + charsElapsedWithinPart;
  if (globalCharIndex < 0) globalCharIndex = 0;
  if (globalCharIndex >= seg.totalChars) globalCharIndex = seg.totalChars - 1;

  // find which line contains this globalCharIndex using cumulative
  let lineIndex = 0;
  for (let i = 0; i < seg.cumulative.length; i++) {
    const b = seg.cumulative[i];
    if (b.start <= globalCharIndex && globalCharIndex < b.end) {
      lineIndex = i;
      break;
    }
    // if beyond last char, clamp to last line
    if (i === seg.cumulative.length - 1 && globalCharIndex >= b.end) {
      lineIndex = i;
      break;
    }
  }

  // safety clamp
  const numLines = seg.cumulative.length;
  if (lineIndex < 0) lineIndex = 0;
  if (lineIndex >= numLines) lineIndex = numLines - 1;

  // APPLY MANUAL OFFSET (clamped)
  const requested = lineIndex + (window.manualOffset||0);
  const finalIndex = Math.max(0, Math.min(requested, numLines - 1));

  // store and apply
  window.currentSegIndex = segIndex;
  window.currentLineIndex = finalIndex;
  applyHighlight(segIndex, finalIndex);
};

// -------------------------
// Manual shift controls (Option B: show boundary tooltip when limit reached)
window.highlightUp = function(){
  const seg = (window.lyricsData && window.lyricsData.tamilSegments && window.currentSegIndex>=0)
    ? window.lyricsData.tamilSegments[window.currentSegIndex]
    : null;
  if (!seg) {
    window.manualOffset = (window.manualOffset||0) - 1;
    return;
  }
  // autoIndex = the line index that would be computed automatically right now (without manual offset)
  const autoIndex = window.currentLineIndex - (window.manualOffset||0);
  const minOffset = -autoIndex;
  if ((window.manualOffset||0) <= minOffset) {
    showBoundaryTooltip('Top reached');
    return;
  }
  window.manualOffset = (window.manualOffset||0) - 1;
};

window.highlightDown = function(){
  const seg = (window.lyricsData && window.lyricsData.tamilSegments && window.currentSegIndex>=0)
    ? window.lyricsData.tamilSegments[window.currentSegIndex]
    : null;
  if (!seg) {
    window.manualOffset = (window.manualOffset||0) + 1;
    return;
  }
  const autoIndex = window.currentLineIndex - (window.manualOffset||0);
  const maxOffset = seg.lyrics.length - 1 - autoIndex;
  if ((window.manualOffset||0) >= maxOffset) {
    showBoundaryTooltip('End of segment');
    return;
  }
  window.manualOffset = (window.manualOffset||0) + 1;
};

window.highlightReset = function(){ window.manualOffset = 0; };

// -------------------------
// Keyboard shortcuts (↑ ↓ R) — minimal mode
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
// Tooltip for manual offset + boundary alerts (minimal, fades after 2 sec)
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

function showBoundaryTooltip(msg){
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;
  if (!offsetTooltipEl) {
    offsetTooltipEl = document.createElement('div');
    offsetTooltipEl.style.position = 'absolute';
    offsetTooltipEl.style.top = '4px';
    offsetTooltipEl.style.right = '8px';
    offsetTooltipEl.style.fontSize = '12px';
    offsetTooltipEl.style.color = '#a00';
    offsetTooltipEl.style.background = 'rgba(255,230,230,0.9)';
    offsetTooltipEl.style.padding = '2px 6px';
    offsetTooltipEl.style.borderRadius = '4px';
    offsetTooltipEl.style.pointerEvents = 'none';
    offsetTooltipEl.style.transition = 'opacity 0.4s';
    box.style.position = 'relative';
    box.appendChild(offsetTooltipEl);
  }
  offsetTooltipEl.textContent = msg;
  offsetTooltipEl.style.opacity = '1';
  if (offsetTooltipTimer) clearTimeout(offsetTooltipTimer);
  offsetTooltipTimer = setTimeout(() => { if (offsetTooltipEl) offsetTooltipEl.style.opacity = '0'; }, 2000);
}

// End of file
// -------------------------
