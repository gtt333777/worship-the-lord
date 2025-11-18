// ===============================================================
// lyricsViewer.js  —  Character-weighted timing + whole-line highlight
//  - Auto-split by characters (adaptive) — optimized for smoothness
//  - Dynamic time-lead system (3.5s → 0s) to fix lag
//  - Counts Tamil chars + spaces (ignores English labels like "1st time")
//  - Default: 1-line highlight (bold + yellow background)
//  - Clean, distraction-free (no fades, no glows)
//  - Auto-scroll positions current line 3 lines below top





// ===============================================================

// --------- PUBLIC / GLOBALS ----------
window.lyricsData = null;              
window._lyricsProcessed = null;       
window.currentSegIndex = -1;
window.currentLineIndex = -1;

// Highlight controls
window.highlightMode = "lines";
window.highlightLines = 1;

// Manual offset globals
window.manualOffset = 0;

// === Time-lead Fix Globals (NEW) ===
// Will be set to 3.5 on new segment (optimized)
let highlightTimeLead = 0;

// === Auto-split Tunables (optimized) ===
let targetCharsPerSplit = 35;   // optimized for smoothness & accuracy
let maxPartsLimit = 10;         // optimized cap

// Expose tunables
window.setTargetCharsPerSplit = function(n){
  const v = parseInt(n, 10);
  if (!isNaN(v) && v > 0) targetCharsPerSplit = v;
};
window.setMaxPartsLimit = function(n){
  const v = parseInt(n, 10);
  if (!isNaN(v) && v > 0) maxPartsLimit = v;
};

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
// -------------------------
function cleanTamilLine(line) {
  if (!line || typeof line !== 'string') return '';
  line = line.trim();
  const allowed = /[\u0B80-\u0BFF\u00A0\u0020]/g;
  const matches = line.match(allowed);
  if (!matches) return '';
  return matches.join('').replace(/\s+/g, ' ').trim();
}

// -------------------------
// PROCESS LYRICS (Auto-Split)
// -------------------------
function processLyricsData(raw) {
  if (!raw || !Array.isArray(raw.tamilSegments)) return null;

  const processed = raw.tamilSegments.map(seg => {
    const cleanedLines = (seg.lyrics || []).map(l => cleanTamilLine(l));
    const charCounts = cleanedLines.map(l => l.length || 0);
    const totalChars = charCounts.reduce((s, v) => s + (v || 0), 0);
    const duration = (seg.end - seg.start);

    // Build cumulative
    const cumulative = [];
    let cursor = 0;
    for (let c of charCounts) {
      cumulative.push({ start: cursor, end: cursor + c });
      cursor += c;
    }

    // Auto-split
    let parts = [];
    if (totalChars <= 0 || duration <= 0) {
      parts = [{
        index: 0,
        charStart: 0,
        charEnd: Math.max(0, totalChars),
        charsInPart: Math.max(0, totalChars),
        timeStart: seg.start,
        timeEnd: seg.end,
        duration: duration,
        perChar: (totalChars > 0) ? duration / totalChars : duration
      }];
    } else {
      let partsCount = Math.ceil(totalChars / targetCharsPerSplit);
      partsCount = Math.max(1, Math.min(partsCount, Math.min(maxPartsLimit, totalChars)));

      const durationPart = duration / partsCount;

      for (let i = 0; i < partsCount; i++) {
        const cs = Math.floor(totalChars * i / partsCount);
        const ce = (i === partsCount - 1) ? totalChars : Math.floor(totalChars * (i + 1) / partsCount);
        const charsInPart = Math.max(0, ce - cs);
        const tStart = seg.start + i * durationPart;
        const tEnd = seg.start + (i + 1) * durationPart;

        parts.push({
          index: i,
          charStart: cs,
          charEnd: ce,
          charsInPart,
          timeStart: tStart,
          timeEnd: tEnd,
          duration: durationPart,
          perChar: (charsInPart > 0) ? (durationPart / charsInPart) : durationPart
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
// LOAD JSON
// -------------------------
window.loadLyricsFromJSON = function (jsonData) {
  console.log('📘 Lyrics loaded:', jsonData);
  window.lyricsData = jsonData;
  window._lyricsProcessed = processLyricsData(jsonData);
  window.currentSegIndex = -1;
  window.currentLineIndex = -1;
  window.manualOffset = 0;
  highlightTimeLead = 0;

  renderTamilLyrics();
  insertAdjustButtons();
  renderEnglishLyrics();
};

// -------------------------
// Insert offset buttons
// -------------------------
function insertAdjustButtons(){
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;

  const old = document.getElementById('lyricsAdjustButtons');
  if (old) old.remove();

  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.position = 'relative';

  const btnBar = document.createElement('div');
  btnBar.id = 'lyricsAdjustButtons';

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
// Render Tamil
// -------------------------
window.tamilRendered = [];

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
      lineEl.textContent = cleanTamilLine(line) || '\u00A0';
      lineEl.style.padding = '4px 0';
      lineEl.style.transition = 'none';
      lineEl.style.whiteSpace = 'pre-wrap';
      lineEl.style.fontSize = '16px';
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
// Render English
// -------------------------
function renderEnglishLyrics() {
  const box = document.getElementById('englishLyricsBox');
  if (!box) return;
  box.innerHTML = '';
  if (!window.lyricsData || !window.lyricsData.englishLyrics) return;
  box.textContent = window.lyricsData.englishLyrics.join('\n');
}

// -------------------------
// Scroll target line 3 lines below top
// -------------------------
function scrollToThreeLinesBelowTop(el) {
  if (!el) return;
  if (userIsScrolling) return;

  const rect = el.getBoundingClientRect();
  const lineHeight = 28;
  const offset = lineHeight * 3;
  const scrollAmount = rect.top - offset;

  window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
}

// -------------------------
// Clear highlights
// -------------------------
function clearAllHighlights() {
  window.tamilRendered.forEach(item => {
    item.el.style.background = 'transparent';
    item.el.style.fontWeight = 'normal';
    item.el.style.color = '#333';
  });
}

// -------------------------
// Apply highlight
// -------------------------
function applyHighlight(segIndex, lineIndex) {
  if (segIndex === -1) {
    clearAllHighlights();
    return;
  }

  const half = Math.floor(window.highlightLines / 2);

  window.tamilRendered.forEach(item => {
    if (item.segIndex !== segIndex) {
      item.el.style.background = 'transparent';
      item.el.style.fontWeight = 'normal';
      item.el.style.color = '#333';
      return;
    }

    const rel = item.lineIndex - lineIndex;
    const within = (window.highlightLines % 2 === 1)
      ? Math.abs(rel) <= half
      : (rel >= 0 && rel < window.highlightLines);

    if (within) {
      item.el.style.background = 'rgba(255,255,0,0.35)';
      item.el.style.fontWeight = 'bold';
      item.el.style.color = '#000';

      if (rel === 0) scrollToThreeLinesBelowTop(item.el);
    } else {
      item.el.style.background = 'transparent';
      item.el.style.fontWeight = 'normal';
      item.el.style.color = '#333';
    }
  });
}

// -------------------------
// UPDATE HIGHLIGHT (Main logic)
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

  // Reset lead if new segment
  if (segIndex !== window.currentSegIndex) {
    highlightTimeLead = 10.0;  // ⭐ optimized start value
  }

  if (segIndex === -1) {
    clearAllHighlights();
    window.currentSegIndex = -1;
    window.currentLineIndex = -1;
    return;
  }

  const seg = segments[segIndex];
  const duration = seg.duration;

  // Apply dynamic lead: 3.5 → 0.0 in steps of 0.5
  let elapsed = (currentTime - seg.start) + highlightTimeLead;
  highlightTimeLead = Math.max(0, highlightTimeLead - 0.5);

  if (!seg.totalChars || seg.totalChars <= 0 || duration <= 0) {
    const numLines = (seg.cleanedLines || []).length || 1;
    const perLine = duration / numLines;
    let lineIndex = Math.floor(elapsed / perLine);
    if (lineIndex >= numLines) lineIndex = numLines - 1;

    const finalIndex = Math.max(0, Math.min(lineIndex + window.manualOffset, numLines - 1));
    window.currentSegIndex = segIndex;
    window.currentLineIndex = finalIndex;
    applyHighlight(segIndex, finalIndex);
    return;
  }

  // Determine part
  const parts = seg.parts;
  let partIndex = Math.floor((elapsed) / parts[0].duration);
  if (partIndex < 0) partIndex = 0;
  if (partIndex >= parts.length) partIndex = parts.length - 1;

  const part = parts[partIndex];
  let elapsedWithinPart = (seg.start + elapsed) - part.timeStart;

  if (elapsedWithinPart < 0) elapsedWithinPart = 0;
  if (elapsedWithinPart > part.duration) elapsedWithinPart = part.duration;

  let charsElapsedWithinPart = (part.charsInPart > 0)
    ? elapsedWithinPart / part.perChar
    : 0;

  let globalCharIndex = part.charStart + charsElapsedWithinPart;
  if (globalCharIndex < 0) globalCharIndex = 0;
  if (globalCharIndex >= seg.totalChars) globalCharIndex = seg.totalChars - 1;

  // Map char index → line
  let lineIndex = 0;
  for (let i = 0; i < seg.cumulative.length; i++) {
    const b = seg.cumulative[i];
    if (b.start <= globalCharIndex && globalCharIndex < b.end) {
      lineIndex = i;
      break;
    }
    if (i === seg.cumulative.length - 1 && globalCharIndex >= b.end) {
      lineIndex = i;
    }
  }

  const numLines = seg.cumulative.length;
  const requested = lineIndex + window.manualOffset;
  const finalIndex = Math.max(0, Math.min(requested, numLines - 1));

  window.currentSegIndex = segIndex;
  window.currentLineIndex = finalIndex;
  applyHighlight(segIndex, finalIndex);
};

// -------------------------
// Manual controls
// -------------------------
window.highlightUp = function(){
  const seg = (window.lyricsData && window.lyricsData.tamilSegments && window.currentSegIndex>=0)
    ? window.lyricsData.tamilSegments[window.currentSegIndex]
    : null;
  if (!seg) {
    window.manualOffset -= 1;
    return;
  }
  const autoIndex = window.currentLineIndex - window.manualOffset;
  const minOffset = -autoIndex;
  if (window.manualOffset <= minOffset) {
    showBoundaryTooltip('Top reached');
    return;
  }
  window.manualOffset -= 1;
};

window.highlightDown = function(){
  const seg = (window.lyricsData && window.lyricsData.tamilSegments && window.currentSegIndex>=0)
    ? window.lyricsData.tamilSegments[window.currentSegIndex]
    : null;
  if (!seg) {
    window.manualOffset += 1;
    return;
  }
  const autoIndex = window.currentLineIndex - window.manualOffset;
  const maxOffset = seg.lyrics.length - 1 - autoIndex;
  if (window.manualOffset >= maxOffset) {
    showBoundaryTooltip('End of segment');
    return;
  }
  window.manualOffset += 1;
};

window.highlightReset = function(){ 
  window.manualOffset = 0; 
};

// -------------------------
// Keyboard shortcuts
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
// Tooltip
// -------------------------
let offsetTooltipEl = null;
let offsetTooltipTimer = null;

function showOffsetTooltip() {
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;

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
    box.style.position = 'relative';
    box.appendChild(offsetTooltipEl);
  }

  const off = window.manualOffset || 0;
  offsetTooltipEl.textContent = off === 0 ? 'Offset: 0 (Sync)' : `Offset: ${off > 0 ? '+'+off : off}`;
  offsetTooltipEl.style.opacity = '1';

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
  offsetTooltipTimer = setTimeout(() => { 
    if (offsetTooltipEl) offsetTooltipEl.style.opacity = '0'; 
  }, 2000);
}

// End of file
// ===============================================================
