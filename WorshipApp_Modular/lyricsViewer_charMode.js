// ===============================================================
// lyricsViewer_charMode.js
// Character-based highlighting mode (global, modular-in-structure)
// Add after your existing lyricsViewer.js. Does NOT modify original file.
// ===============================================================

// CONFIG
window.charMode = window.charMode || {};
window.charMode.countSpaces = true;      // count spaces as characters (set false to ignore spaces)
window.charMode.stepChars = 50;          // how many characters ▲/▼ jumps by
window.charMode.highlightStyle = {
  background: 'rgba(255,255,0,0.35)',
  fontWeight: 'bold',
  color: '#000'
};
window.charMode.normalStyle = {
  background: 'transparent',
  fontWeight: 'normal',
  color: '#333'
};

// STATE
window.charModeEnabled = false;
window._charGlobal = {                   // internal storage
  chars: [],           // array of { ch, segIndex, lineIndex, localIndex, globalIndex, countsTowardsTotal }
  totalChars: 0,
  totalSeconds: 0,
  secondsPerChar: 0,
  lineBounds: []       // for each rendered line: { segIndex, lineIndex, startGidx, endGidx, cleaned }
};
window.manualCharOffsetChars = 0;        // user manual adjustment in chars (can be negative)
window._charRenderedSpans = null;        // cached NodeList of all char spans (query each render)
window._charTooltipEl = null;
window._charTooltipTimer = null;

// -------------------------
// Helpers: reuse your cleanTamilLine function if present, otherwise provide minimal
// -------------------------
function _char_cleanTamilLine(line) {
  if (typeof cleanTamilLine === 'function') return cleanTamilLine(line);
  if (!line || typeof line !== 'string') return '';
  // fallback simple: keep Tamil block and spaces
  const matches = line.match(/[\u0B80-\u0BFF\u00A0\u0020]/g);
  if (!matches) return '';
  return matches.join('').replace(/\s+/g, ' ').trim();
}

// -------------------------
// Build global character array from window.lyricsData
// This treats the whole song as continuous characters across all segments
// -------------------------
function buildGlobalCharArray() {
  const raw = window.lyricsData;
  if (!raw || !Array.isArray(raw.tamilSegments)) {
    window._charGlobal = { chars: [], totalChars: 0, totalSeconds: 0, secondsPerChar: 0, lineBounds: [] };
    return;
  }

  const chars = [];
  const lineBounds = [];
  let gCountedIndex = 0; // counted characters index (only those that count towards total)
  let totalSeconds = 0;

  raw.tamilSegments.forEach((seg, segIndex) => {
    const segDuration = (typeof seg.start === 'number' && typeof seg.end === 'number') ? Math.max(0, seg.end - seg.start) : 0;
    totalSeconds += segDuration;

    (seg.lyrics || []).forEach((line, lineIndex) => {
      const cleaned = _char_cleanTamilLine(line) || '\u00A0'; // ensure layout persists
      const startG = gCountedIndex;
      for (let li = 0; li < cleaned.length; li++) {
        const ch = cleaned[li];
        const counts = !(ch === ' ' && !window.charMode.countSpaces);
        chars.push({
          ch,
          segIndex,
          lineIndex,
          localIndex: li,
          countedIndex: counts ? gCountedIndex : null, // null if not counted
          countsTowardsTotal: counts
        });
        if (counts) gCountedIndex++;
      }
      const endG = gCountedIndex; // exclusive
      lineBounds.push({ segIndex, lineIndex, startGidx: startG, endGidx: endG, cleaned });
    });
  });

  const totalChars = gCountedIndex;
  const secondsPerChar = totalChars > 0 ? (totalSeconds / totalChars) : 0;

  window._charGlobal = { chars, totalChars, totalSeconds, secondsPerChar, lineBounds };
}

// -------------------------
// Render Tamil lyrics with each character wrapped in span[data-gidx]
// This will replace the contents of #tamilLyricsBox when char mode is enabled.
// We keep the same segment/line grouping visually but each char is a span.
// -------------------------
function renderTamilLyricsCharMode() {
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;
  box.innerHTML = '';
  window._charRenderedSpans = null;

  if (!window.lyricsData || !Array.isArray(window.lyricsData.tamilSegments)) return;

  // We'll render visually the same segment/line structure but wrap each character in a span.
  // data-gidx will contain the counted global index for characters that count; empty for non-counting spans.
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
      lineEl.style.padding = '4px 0';
      lineEl.style.transition = 'none';
      lineEl.style.whiteSpace = 'pre-wrap';
      lineEl.style.fontSize = '16px';
      lineEl.style.fontWeight = 'normal';
      lineEl.style.color = '#333';
      lineEl.style.background = 'transparent';

      const cleaned = _char_cleanTamilLine(line) || '\u00A0';

      for (let li = 0, countedIdx = 0; li < cleaned.length; li++) {
        const ch = cleaned[li];
        const span = document.createElement('span');
        span.textContent = ch;

        // Find the corresponding counted index from _charGlobal.chars
        // We'll increment a pointer while searching to remain consistent (but for simplicity, we map via counts)
        // Simpler approach: walk window._charGlobal.chars to find matching segIndex,lineIndex,localIndex entry.
        // To avoid O(n^2) on every render, rely on same cleaning routine so mapping is stable:
        // We'll compute countedIndex by tracking a cursor across chars while constructing spans.
        // Use a static cursor stored in closure is simpler: compute a quick mapping before render.
        span.setAttribute('data-gidx', ''); // default empty
        span.setAttribute('data-nocount', '0');
        // style
        span.style.padding = '0px';
        span.style.margin = '0px';
        span.style.display = 'inline';
        span.style.background = 'transparent';
        span.style.fontWeight = 'normal';
        span.style.color = '#333';

        lineEl.appendChild(span);
      }

      segDiv.appendChild(lineEl);
    });

    box.appendChild(segDiv);
  });

  // After rendering structure, populate data-gidx attributes by walking _charGlobal.chars and matching spans in order.
  // This keeps rendering code simpler and ensures spans correspond to counted indices.
  // Gather all spans in document order and assign counted indices where appropriate.
  const allSpans = box.querySelectorAll('span');
  let spanCursor = 0;
  const gchars = window._charGlobal.chars || [];
  for (let ci = 0; ci < gchars.length; ci++) {
    const entry = gchars[ci];
    // advance spanCursor until we find a span that matches visually (we assume the render order equals chars order)
    // This approach relies on the rendered cleaned strings matching the cleaned in _charGlobal; that is true since same cleaner used.
    while (spanCursor < allSpans.length) {
      const s = allSpans[spanCursor];
      // If span already has data-gidx set (non-empty) skip it. (initially none set)
      const has = s.getAttribute('data-gidx');
      if (has && has.length) {
        spanCursor++;
        continue;
      }
      // Assign based on whether this entry counts
      if (entry.countsTowardsTotal) {
        s.setAttribute('data-gidx', String(entry.countedIndex));
        s.removeAttribute('data-nocount');
      } else {
        s.setAttribute('data-gidx', '');
        s.setAttribute('data-nocount', '1');
      }
      spanCursor++;
      break;
    }
  }

  // For any remaining spans (if any mismatches), mark them as no-count
  for (; spanCursor < allSpans.length; spanCursor++) {
    const s = allSpans[spanCursor];
    if (!s.getAttribute('data-gidx')) {
      s.setAttribute('data-gidx', '');
      s.setAttribute('data-nocount', '1');
    }
  }

  // cache spans
  window._charRenderedSpans = box.querySelectorAll('span');
}

// -------------------------
// Apply character highlight up to (exclusive) finalCountIndex
// finalCountIndex: number of characters that should be highlighted (0 => none, 1 => first char highlighted, etc.)
// -------------------------
function applyCharHighlight(finalCountIndex) {
  if (!window._charRenderedSpans) return;
  const spans = window._charRenderedSpans;
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    const gidxAttr = s.getAttribute('data-gidx');
    if (!gidxAttr) {
      // non-counting char (like space when countSpaces=false) - normal
      s.style.background = window.charMode.normalStyle.background;
      s.style.fontWeight = window.charMode.normalStyle.fontWeight;
      s.style.color = window.charMode.normalStyle.color;
      continue;
    }
    const gidx = parseInt(gidxAttr, 10);
    if (!isNaN(gidx) && gidx < finalCountIndex) {
      // highlighted
      s.style.background = window.charMode.highlightStyle.background;
      s.style.fontWeight = window.charMode.highlightStyle.fontWeight;
      s.style.color = window.charMode.highlightStyle.color;
    } else {
      // normal
      s.style.background = window.charMode.normalStyle.background;
      s.style.fontWeight = window.charMode.normalStyle.fontWeight;
      s.style.color = window.charMode.normalStyle.color;
    }
  }
}

// -------------------------
// Scroll helper: ensure current highlighted char is visible
// We find the last highlighted span and scroll it into view (keep 3 lines below top like before)
// -------------------------
function scrollToCharIndex(finalCountIndex) {
  if (!window._charRenderedSpans) return;
  let lastSpan = null;
  for (let i = window._charRenderedSpans.length - 1; i >= 0; i--) {
    const s = window._charRenderedSpans[i];
    const gidxAttr = s.getAttribute('data-gidx');
    if (!gidxAttr) continue;
    const gidx = parseInt(gidxAttr, 10);
    if (!isNaN(gidx) && gidx < finalCountIndex) {
      lastSpan = s;
      break;
    }
  }
  if (!lastSpan) return;

  if (typeof userIsScrolling !== 'undefined' && userIsScrolling) return;

  const rect = lastSpan.getBoundingClientRect();
  const lineHeight = 28; // keep same as your other logic
  const offset = lineHeight * 3;
  const targetTop = offset;
  const currentTop = rect.top;
  const scrollAmount = currentTop - targetTop;
  window.scrollBy({ top: scrollAmount, left: 0, behavior: 'smooth' });
}

// -------------------------
// Public: enable character mode
// This will build arrays and re-render tamil box in char-mode
// -------------------------
window.enableCharacterMode = function () {
  window.charModeEnabled = true;
  buildGlobalCharArray();
  renderTamilLyricsCharMode();
  // cache spans
  const box = document.getElementById('tamilLyricsBox');
  if (box) window._charRenderedSpans = box.querySelectorAll('span');
  // create control buttons (bottom-right) if missing
  _char_insertAdjustButtons();
};

// -------------------------
// Public: disable character mode (restore your original render)
// This will re-render using your existing renderTamilLyrics if it exists
// -------------------------
window.disableCharacterMode = function () {
  window.charModeEnabled = false;
  // remove char-mode buttons if present - function will recreate when enabling
  const old = document.getElementById('charModeAdjustButtons');
  if (old) old.remove();
  // restore original rendering if function exists
  if (typeof renderTamilLyrics === 'function') {
    renderTamilLyrics();
  } else {
    // if no renderTamilLyrics, clear and render nothing
    const box = document.getElementById('tamilLyricsBox');
    if (box) box.innerHTML = '';
  }
};

// -------------------------
// Main updater: call this from your audio loop in place of updateLyricsHighlight
// It is designed to be called with currentTime (seconds) repeatedly
// If charModeEnabled is false it does nothing
// -------------------------
window.updateCharModeHighlight = function (currentTime) {
  if (!window.charModeEnabled) return;
  if (!window._charGlobal || !Array.isArray(window._charGlobal.chars)) {
    buildGlobalCharArray();
    renderTamilLyricsCharMode();
    window._charRenderedSpans = document.getElementById('tamilLyricsBox')?.querySelectorAll('span') || null;
  }

  const g = window._charGlobal;
  if (!g.secondsPerChar || g.secondsPerChar <= 0 || g.totalChars <= 0) {
    applyCharHighlight(0);
    return;
  }

  const baseCharsElapsed = Math.floor(currentTime / g.secondsPerChar);
  const requested = baseCharsElapsed + (window.manualCharOffsetChars || 0);

  const finalCount = Math.max(0, Math.min(requested, g.totalChars));

  applyCharHighlight(finalCount);
  scrollToCharIndex(finalCount);

  window.currentGlobalCharIndex = finalCount;
};

// -------------------------
// Controls: increment/decrement/reset manual offset in characters
// Buttons at bottom-right similar to your previous bar
// -------------------------
window.charStepForward = function () {
  window.manualCharOffsetChars = (window.manualCharOffsetChars || 0) + (window.charMode.stepChars || 50);
  _char_showOffsetTooltip();
  if (typeof window.currentAudioTime === 'number') {
    window.updateCharModeHighlight(window.currentAudioTime);
  }
};
window.charStepBackward = function () {
  window.manualCharOffsetChars = (window.manualCharOffsetChars || 0) - (window.charMode.stepChars || 50);
  _char_showOffsetTooltip();
  if (typeof window.currentAudioTime === 'number') {
    window.updateCharModeHighlight(window.currentAudioTime);
  }
};
window.charStepReset = function () {
  window.manualCharOffsetChars = 0;
  _char_showOffsetTooltip();
  if (typeof window.currentAudioTime === 'number') {
    window.updateCharModeHighlight(window.currentAudioTime);
  }
};

// -------------------------
// Insert bottom-right buttons for char-mode (updated with CHAR/LINE toggle button color change)
// -------------------------
function _char_insertAdjustButtons() {
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;

  // Remove if exists
  const old = document.getElementById('charModeAdjustButtons');
  if (old) old.remove();

  // Ensure layout
  box.style.display = box.style.display || 'flex';
  box.style.flexDirection = box.style.flexDirection || 'column';
  box.style.position = box.style.position || 'relative';

  const btnBar = document.createElement('div');
  btnBar.id = 'charModeAdjustButtons';

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

  function makeBtn(label, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.fontSize = '12px';
    b.style.padding = '2px 6px';
    b.style.border = '1px solid #bbb';
    b.style.borderRadius = '4px';
    b.style.cursor = 'pointer';
    b.style.background = 'white';
    b.style.color = '#000';
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });
    return b;
  }

  // ▲ ▼ ⟳ buttons
  btnBar.appendChild(makeBtn('▲', () => { window.charStepBackward(); }));
  btnBar.appendChild(makeBtn('▼', () => { window.charStepForward(); }));
  btnBar.appendChild(makeBtn('⟳', () => { window.charStepReset(); }));

  // CHARACTER MODE TOGGLE BUTTON
  const toggleBtn = makeBtn('CHAR', () => {
    if (!window.charModeEnabled) {
      enableCharacterMode();
      toggleBtn.textContent = 'LINE';
      toggleBtn.style.background = '#32cd32';   // green
      toggleBtn.style.color = '#000';
    } else {
      disableCharacterMode();
      toggleBtn.textContent = 'CHAR';
      toggleBtn.style.background = 'white';
      toggleBtn.style.color = '#000';
    }
  });

  // If character mode is already enabled when this function runs, set active look
  if (window.charModeEnabled) {
    toggleBtn.textContent = 'LINE';
    toggleBtn.style.background = '#32cd32';
  }

  btnBar.appendChild(toggleBtn);
  box.appendChild(btnBar);
}

// -------------------------
// Tooltip (mirror earlier approach)
function _char_showOffsetTooltip() {
  const box = document.getElementById('tamilLyricsBox');
  if (!box) return;
  if (!_charTooltipEl) {
    _charTooltipEl = document.createElement('div');
    _charTooltipEl.style.position = 'absolute';
    _charTooltipEl.style.top = '4px';
    _charTooltipEl.style.right = '8px';
    _charTooltipEl.style.fontSize = '12px';
    _charTooltipEl.style.color = '#555';
    _charTooltipEl.style.background = 'rgba(255,255,255,0.7)';
    _charTooltipEl.style.padding = '2px 6px';
    _charTooltipEl.style.borderRadius = '4px';
    _charTooltipEl.style.pointerEvents = 'none';
    _charTooltipEl.style.transition = 'opacity 0.4s';
    box.style.position = 'relative';
    box.appendChild(_charTooltipEl);
  }
  const off = window.manualCharOffsetChars || 0;
  _charTooltipEl.textContent = off === 0 ? 'Char Offset: 0' : `Char Offset: ${off > 0 ? '+' + off : off}`;
  _charTooltipEl.style.opacity = '1';
  if (_charTooltipTimer) clearTimeout(_charTooltipTimer);
  _charTooltipTimer = setTimeout(() => { if (_charTooltipEl) _charTooltipEl.style.opacity = '0'; }, 2000);
}

// -------------------------
// Keyboard shortcuts for char mode: Left / Right / R
// -------------------------
window.addEventListener('keydown', (e) => {
  if (!window.charModeEnabled) return;
  if (e.key === 'ArrowRight') {
    window.charStepForward();
    e.preventDefault();
  } else if (e.key === 'ArrowLeft') {
    window.charStepBackward();
    e.preventDefault();
  } else if (e.key.toLowerCase() === 'r') {
    window.charStepReset();
    e.preventDefault();
  }
});

// -------------------------
// Optional API: call this to update using your audio time provider.
// I will not poll audio - I expect you to call updateCharModeHighlight(currentTime) from your audio loop.
// For convenience, some apps set window.currentAudioTime each tick; we check that in step buttons above.
// -------------------------
