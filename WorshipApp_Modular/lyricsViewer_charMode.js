// ===============================================================
// lyricsViewer_charMode.js  (GOLD — Optimized: chunks=5 + smoothing + RAF)
// ---------------------------------------------------------------
// - Per-segment timing with mid-segment chunks (5 chars)
// - Optional curvature smoothing (smoothingFactor)
// - requestAnimationFrame update loop (smooth 60fps updates)
// - Precomputed spanByGidx for O(1) lookups
// - Dirty-range style updates (only changed spans are written)
// - CSS class toggling injected (fast style changes)
// - Lazy scrolling (scroll every N chars moved)
// - Keeps DOM, span mapping, buttons, IDs unchanged
// ===============================================================

// CONFIG
window.charMode = window.charMode || {};
window.charMode.countSpaces = true;
window.charMode.stepChars = 5;
window.charMode.chunkSize = 5; // higher resolution
window.charMode.smoothingFactor = 0.90; // <1 slows start, >1 speeds start; 0.85 recommended
window.charMode.scrollThreshold = 3; // scroll only when highlighted index moved by >= this
window.charMode.highlightClass = 'charmode-highlight';
window.charMode.normalClass = 'charmode-normal';

// STATE
window.charModeEnabled = false;
window.manualCharOffsetChars = 0;
window._charRenderedSpans = null;
window._charTooltipEl = null;
window._charTooltipTimer = null;
window._charGlobal = {
  chars: [],
  totalChars: 0,
  totalLyricsSeconds: 0,
  segments: []
};

// PERF caches
window._charSpanByGidx = null; // array mapping gidx -> span (or null)
window._charPrevHighlightedIndex = 0;
window._charRAFId = null;

// inject fast CSS classes once
(function _ensureCharModeStyles() {
  if (document.getElementById('charModeInjectedStyles')) return;
  const style = document.createElement('style');
  style.id = 'charModeInjectedStyles';
  style.textContent = `
    .${window.charMode.highlightClass} {
      background: rgba(255,255,0,0.35) !important;
      color: #000 !important;
      font-weight: bold !important;
    }
    .${window.charMode.normalClass} {
      background: transparent !important;
      color: #333 !important;
      font-weight: normal !important;
    }
  `;
  document.head && document.head.appendChild(style);
})();

// --------------------------------------------------------------
// Clean Tamil line (preserve Tamil range + NBSP + space)
// --------------------------------------------------------------
function _char_cleanTamilLine(line) {
  if (typeof cleanTamilLine === 'function') return cleanTamilLine(line);
  if (!line || typeof line !== 'string') return '';
  const m = line.match(/[\u0B80-\u0BFF\u00A0\u0020]/g);
  if (!m) return '';
  return m.join('').replace(/\s+/g, ' ').trim();
}

// --------------------------------------------------------------
// Build global character array AND compute per-segment chunks
// --------------------------------------------------------------
function buildGlobalCharArray() {
  const raw = window.lyricsData;
  if (!raw || !Array.isArray(raw.tamilSegments)) {
    window._charGlobal = { chars: [], totalChars: 0, totalLyricsSeconds: 0, segments: [] };
    return;
  }

  const chars = [];
  const segments = [];
  let gCounted = 0;

  const firstStart = raw.tamilSegments.length ? raw.tamilSegments[0].start : 0;
  const lastEnd = raw.tamilSegments.length ? raw.tamilSegments[raw.tamilSegments.length - 1].end : firstStart;
  const totalLyricsSeconds = Math.max(0, lastEnd - firstStart);

  raw.tamilSegments.forEach((seg, segIndex) => {
    const segStart = (typeof seg.start === 'number') ? seg.start : 0;
    const segEnd = (typeof seg.end === 'number') ? seg.end : segStart;
    const segDuration = Math.max(0, segEnd - segStart);

    const segEntry = {
      start: segStart,
      end: segEnd,
      duration: segDuration,
      startGidx: gCounted,
      totalChars: 0,
      chunks: [],
      lineBounds: []
    };

    (seg.lyrics || []).forEach((line, lineIndex) => {
      const cleaned = _char_cleanTamilLine(line) || '\u00A0';
      const startG = gCounted;

      for (let li = 0; li < cleaned.length; li++) {
        const ch = cleaned[li];
        const counts = !(ch === ' ' && !window.charMode.countSpaces);

        chars.push({
          ch,
          segIndex,
          lineIndex,
          localIndex: li,
          countedIndex: counts ? gCounted : null,
          countsTowardsTotal: counts
        });

        if (counts) gCounted++;
      }

      const endG = gCounted;
      segEntry.lineBounds.push({ segIndex, lineIndex, startGidx: startG, endGidx: endG, cleaned });
    });

    segEntry.totalChars = gCounted - segEntry.startGidx;

    // chunking by character count (fixed-size chunks)
    const chunkSize = Math.max(1, parseInt(window.charMode.chunkSize || 5, 10));
    const total = segEntry.totalChars;
    const numChunks = total > 0 ? Math.max(1, Math.ceil(total / chunkSize)) : 1;
    const baseChunkDuration = numChunks > 0 ? (segEntry.duration / numChunks) : Infinity;

    for (let c = 0; c < numChunks; c++) {
      const cStart = segEntry.startGidx + c * chunkSize;
      const cEnd = Math.min(segEntry.startGidx + (c + 1) * chunkSize, segEntry.startGidx + total);
      const cChars = Math.max(0, cEnd - cStart);
      const cDur = baseChunkDuration;
      const secondsPerChar = cChars > 0 ? (cDur / cChars) : Infinity;
      segEntry.chunks.push({ startGidx: cStart, endGidx: cEnd, totalChars: cChars, duration: cDur, secondsPerChar });
    }

    segments.push(segEntry);
  });

  window._charGlobal = { chars, totalChars: gCounted, totalLyricsSeconds, segments };

  // build fast spanByGidx cache placeholder (filled after render)
  window._charSpanByGidx = new Array(Math.max(0, gCounted));
  for (let i = 0; i < window._charSpanByGidx.length; i++) window._charSpanByGidx[i] = null;
}

// --------------------------------------------------------------
// Render Tamil lyrics with each character wrapped in spans
// (DOM mapping unchanged — keep data-gidx global)
// After render, build spanByGidx cache for O(1) access
// --------------------------------------------------------------
function renderTamilLyricsCharMode() {
  const box = document.getElementById("tamilLyricsBox");
  if (!box) return;
  box.innerHTML = "";
  window._charRenderedSpans = null;
  window._charSpanByGidx = window._charSpanByGidx || [];

  const raw = window.lyricsData;
  if (!raw || !Array.isArray(raw.tamilSegments)) return;

  raw.tamilSegments.forEach((seg, segIndex) => {
    const segDiv = document.createElement('div');
    segDiv.style.marginBottom = "16px";

    const title = document.createElement('div');
    title.textContent = `Segment ${segIndex + 1}`;
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    segDiv.appendChild(title);

    (seg.lyrics || []).forEach((line) => {
      const lineEl = document.createElement('div');
      lineEl.style.padding = '4px 0';
      lineEl.style.whiteSpace = 'pre-wrap';
      lineEl.style.fontSize = '16px';
      lineEl.style.color = '#333';

      const cleaned = _char_cleanTamilLine(line) || '\u00A0';
      for (let i = 0; i < cleaned.length; i++) {
        const span = document.createElement('span');
        span.textContent = cleaned[i];
        span.setAttribute('data-gidx', '');
        span.classList.add(window.charMode.normalClass || 'charmode-normal');
        lineEl.appendChild(span);
      }

      segDiv.appendChild(lineEl);
    });

    box.appendChild(segDiv);
  });

  // map chars -> spans (preserve mapping behavior)
  const spanList = box.querySelectorAll('span');
  let cursor = 0;
  const gchars = window._charGlobal.chars || [];

  for (let ci = 0; ci < gchars.length; ci++) {
    const entry = gchars[ci];

    while (cursor < spanList.length) {
      const s = spanList[cursor];
      const has = s.getAttribute('data-gidx');
      if (has && has.length) {
        cursor++;
        continue;
      }
      if (entry.countsTowardsTotal) {
        const gidx = String(entry.countedIndex);
        s.setAttribute('data-gidx', gidx);
        // cache into spanByGidx
        if (entry.countedIndex !== null && typeof entry.countedIndex === 'number') {
          window._charSpanByGidx[entry.countedIndex] = s;
        }
      }
      cursor++;
      break;
    }
  }

  // Safety: ensure spanByGidx length matches totalChars
  if (Array.isArray(window._charSpanByGidx) && window._charSpanByGidx.length !== window._charGlobal.totalChars) {
    const old = window._charSpanByGidx;
    window._charSpanByGidx = new Array(Math.max(0, window._charGlobal.totalChars));
    for (let i = 0; i < window._charSpanByGidx.length; i++) window._charSpanByGidx[i] = old[i] || null;
  }

  window._charRenderedSpans = spanList;
}

// --------------------------------------------------------------
// Apply highlight changes — optimized to update only changed spans
// --------------------------------------------------------------
function applyCharHighlightOptimized(newIndex) {
  // newIndex is integer target; prevIndex may be fractional stored as prev floor
  const prev = Math.floor(window._charPrevHighlightedIndex || 0);
  const cur = Math.floor(newIndex);

  if (prev === cur) return; // nothing changed

  const spanByGidx = window._charSpanByGidx || [];
  // determine dirty range (min..max exclusive of upper bound)
  const start = Math.min(prev, cur);
  const end = Math.max(prev, cur);

  // If highlight moved forward, mark newly highlighted spans
  if (cur > prev) {
    for (let i = start; i < end; i++) {
      const sp = spanByGidx[i];
      if (!sp) continue;
      // only update if not already highlighted
      if (!sp.classList.contains(window.charMode.highlightClass)) {
        sp.classList.remove(window.charMode.normalClass);
        sp.classList.add(window.charMode.highlightClass);
      }
    }
  } else {
    // moved backward: un-highlight spans in [cur, prev)
    for (let i = start; i < end; i++) {
      const sp = spanByGidx[i];
      if (!sp) continue;
      if (!sp.classList.contains(window.charMode.normalClass)) {
        sp.classList.remove(window.charMode.highlightClass);
        sp.classList.add(window.charMode.normalClass);
      }
    }
  }

  window._charPrevHighlightedIndex = cur;
}

// Fallback for older code paths (keeps external contract)
function applyCharHighlight(finalCountIndex) {
  // Use optimized path if cache available
  if (Array.isArray(window._charSpanByGidx) && window._charSpanByGidx.length) {
    applyCharHighlightOptimized(finalCountIndex);
    return;
  }

  // otherwise full scan (legacy)
  if (!window._charRenderedSpans) return;
  for (const s of window._charRenderedSpans) {
    const v = s.getAttribute('data-gidx');
    if (!v) {
      s.classList.remove(window.charMode.highlightClass);
      s.classList.add(window.charMode.normalClass);
      continue;
    }
    const gidx = parseInt(v, 10);
    if (gidx < finalCountIndex) {
      s.classList.remove(window.charMode.normalClass);
      s.classList.add(window.charMode.highlightClass);
    } else {
      s.classList.remove(window.charMode.highlightClass);
      s.classList.add(window.charMode.normalClass);
    }
  }
}

// --------------------------------------------------------------
// Scroll support — lazy scrolling (only when moved enough)
// --------------------------------------------------------------
function scrollToCharIndexLazy(finalCountIndex) {
  if (!window._charRenderedSpans) return;

  const prev = Math.floor(window._charPrevScrollIndex || 0);
  const cur = Math.floor(finalCountIndex);
  const threshold = window.charMode.scrollThreshold || 3;
  if (Math.abs(cur - prev) < threshold) {
    // do not scroll
    return;
  }

  // find the last highlighted span (cur - 1)
  const targetIdx = Math.max(0, cur - 1);
  const sp = (window._charSpanByGidx && window._charSpanByGidx[targetIdx]) || null;
  if (!sp) return;

  const rect = sp.getBoundingClientRect();
  const offset = 28 * 3;
  const scrollAmount = rect.top - offset;

  const box = document.getElementById('tamilLyricsBox');
  if (box) {
    box.scrollTop += scrollAmount;
    window._charPrevScrollIndex = cur;
  }
}

// --------------------------------------------------------------
// Main per-frame engine (uses smoothing, chunks, clamp B1)
// --------------------------------------------------------------
function _computeGlobalIndexFromTime(currentTime) {
  const g = window._charGlobal;
  if (!g || !Array.isArray(g.segments) || g.segments.length === 0) return 0;
  if (typeof g.totalChars !== 'number') g.totalChars = (g.chars || []).reduce((acc, e) => acc + (e.countsTowardsTotal ? 1 : 0), 0);

  const segments = g.segments;
  // find last segment whose start <= currentTime
  let segIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    if (currentTime >= segments[i].start) segIndex = i;
    else break;
  }
  if (segIndex === -1) return 0;

  const seg = segments[segIndex];
  const segStart = seg.start;
  const segEnd = seg.end;

  if (!seg.totalChars || seg.totalChars <= 0) return seg.startGidx;

  // If time beyond segment end: clamp to last char of this segment (B1)
  if (currentTime > segEnd) {
    return seg.startGidx + seg.totalChars;
  }

  // inside segment -> map to chunk
  const rel = Math.max(0, currentTime - segStart);
  const numChunks = Math.max(1, seg.chunks.length);
  const chunkDuration = seg.duration / numChunks;

  // chunk index
  let chunkIndex = Math.floor(rel / (chunkDuration || 1e-9));
  if (chunkIndex < 0) chunkIndex = 0;
  if (chunkIndex >= numChunks) chunkIndex = numChunks - 1;

  const chunk = seg.chunks[chunkIndex];
  const chunkStartTime = chunkIndex * chunkDuration;
  const relInChunk = Math.max(0, rel - chunkStartTime);

  // base local index inside chunk using secondsPerChar
  let baseLocal = 0;
  if (!isFinite(chunk.secondsPerChar) || chunk.secondsPerChar <= 0) {
    baseLocal = 0;
  } else {
    baseLocal = relInChunk / chunk.secondsPerChar;
  }

  // apply curvature smoothing per-segment optionally
  const smoothing = typeof window.charMode.smoothingFactor === 'number' ? window.charMode.smoothingFactor : 1.0;
  // smoothing acts on normalized progress within the chunk (0..1)
  let normalized = 0;
  if (chunk.totalChars > 0) {
    normalized = Math.max(0, Math.min(1, baseLocal / chunk.totalChars));
    // apply power curve, keep result in [0,1]
    if (smoothing > 0 && smoothing !== 1) {
      normalized = Math.pow(normalized, smoothing);
    }
    baseLocal = normalized * chunk.totalChars;
  }

  const localClamped = Math.max(0, Math.min(baseLocal, chunk.totalChars));
  const globalIndex = chunk.startGidx + Math.floor(localClamped);
  return globalIndex;
}

// RAF loop
function _charModeFrameLoop() {
  if (!window.charModeEnabled) {
    window._charRAFId = null;
    return;
  }

  const ct = (window.vocalAudio && typeof window.vocalAudio.currentTime === 'number') ? window.vocalAudio.currentTime : 0;
  // compute raw global index
  const rawIndex = _computeGlobalIndexFromTime(ct);
  // apply manual offset
  const offsetApplied = rawIndex + (window.manualCharOffsetChars || 0);
  // clamp
  const limited = Math.max(0, Math.min(offsetApplied, (window._charGlobal.totalChars || 0)));

  // optimized apply
  applyCharHighlightOptimized(Math.floor(limited));
  scrollToCharIndexLazy(Math.floor(limited));
  window.currentGlobalCharIndex = limited;

  // schedule next frame
  window._charRAFId = window.requestAnimationFrame(_charModeFrameLoop);
}

// --------------------------------------------------------------
// Enable / Disable (start / stop RAF loop)
// --------------------------------------------------------------
window.enableCharacterMode = function () {
  window.charModeEnabled = true;
  window.manualCharOffsetChars = 0;

  buildGlobalCharArray();
  renderTamilLyricsCharMode();

  const box = document.getElementById("tamilLyricsBox");
  if (box) window._charRenderedSpans = box.querySelectorAll('span');

  // reset caches/state
  window._charPrevHighlightedIndex = 0;
  window._charPrevScrollIndex = 0;

  // start RAF loop
  if (!window._charRAFId) {
    window._charRAFId = window.requestAnimationFrame(_charModeFrameLoop);
  }

  // show controls
  _char_insertAdjustButtons();
};

window.disableCharacterMode = function () {
  window.charModeEnabled = false;
  if (window._charRAFId) {
    window.cancelAnimationFrame(window._charRAFId);
    window._charRAFId = null;
  }
  const old = document.getElementById("charModeAdjustButtons");
  if (old) old.remove();
  if (typeof renderTamilLyrics === 'function') renderTamilLyrics();
};

// --------------------------------------------------------------
// Controls (unchanged behavior)
// --------------------------------------------------------------
window.charStepForward = function () {
  window.manualCharOffsetChars += window.charMode.stepChars;
  _char_showOffsetTooltip();
};

window.charStepBackward = function () {
  window.manualCharOffsetChars -= window.charMode.stepChars;
  _char_showOffsetTooltip();
};

window.charStepReset = function () {
  window.manualCharOffsetChars = 0;
  _char_showOffsetTooltip();
};

// --------------------------------------------------------------
// Buttons & Tooltip (unchanged, small cosmetics preserved)
// --------------------------------------------------------------
function _char_insertAdjustButtons() {
  const box = document.getElementById("tamilLyricsBox");
  if (!box) return;

  const old = document.getElementById("charModeAdjustButtons");
  if (old) old.remove();

  const bar = document.createElement("div");
  bar.id = "charModeAdjustButtons";
  bar.style.position = "sticky";
  bar.style.bottom = "4px";
  bar.style.alignSelf = "flex-end";
  bar.style.display = "flex";
  bar.style.gap = "4px";
  bar.style.background = "white";
  bar.style.padding = "4px";
  bar.style.border = "1px solid #ccc";
  bar.style.borderRadius = "6px";
  bar.style.zIndex = "9999";

  function btn(t, f) {
    const b = document.createElement("button");
    b.textContent = t;
    b.style.fontSize = "12px";
    b.style.padding = "2px 6px";
    b.onclick = f;
    return b;
  }

  bar.appendChild(btn("▲", () => charStepBackward()));
  bar.appendChild(btn("▼", () => charStepForward()));
  bar.appendChild(btn("⟳", () => charStepReset()));

  const tgl = btn("LINE", () => {
    disableCharacterMode();
  });
  tgl.style.background = "#32cd32";

  bar.appendChild(tgl);
  box.appendChild(bar);
}

function _char_showOffsetTooltip() {
  const box = document.getElementById("tamilLyricsBox");
  if (!box) return;

  if (!window._charTooltipEl) {
    const t = document.createElement('div');
    t.style.position = 'absolute';
    t.style.top = '4px';
    t.style.right = '8px';
    t.style.padding = '3px 6px';
    t.style.background = 'white';
    t.style.border = '1px solid #ccc';
    t.style.fontSize = '12px';
    t.style.opacity = '0.9';
    box.appendChild(t);
    window._charTooltipEl = t;
  }

  const off = window.manualCharOffsetChars;
  window._charTooltipEl.textContent = `Offset: ${off >= 0 ? "+"+off : off}`;

  if (window._charTooltipTimer) clearTimeout(window._charTooltipTimer);
  window._charTooltipTimer = setTimeout(() => {
    if (window._charTooltipEl) window._charTooltipEl.remove();
    window._charTooltipEl = null;
  }, 2000);
}

window.addEventListener('keydown', (e) => {
  if (!window.charModeEnabled) return;
  if (e.key === "ArrowRight") { charStepForward(); e.preventDefault(); }
  if (e.key === "ArrowLeft")  { charStepBackward(); e.preventDefault(); }
  if (e.key.toLowerCase() === "r") { charStepReset(); e.preventDefault(); }
});
