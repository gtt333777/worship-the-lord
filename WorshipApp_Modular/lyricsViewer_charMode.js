// ===============================================================
// lyricsViewer_charMode.js  (FINAL — SEGMENT-WISE + MID-SEGMENT CHUNKS)
// ---------------------------------------------------------------
// ⭐ Gold Standard Version — 10-character timing chunks
// - Per-segment timing with chunking
// - Continuous global gidx mapping retained (no DOM/render changes)
// - Clamp to segment end until next segment starts (B1 behavior)
// - Keeps all UI, DOM, buttons, and global structure unchanged
// ===============================================================

// CONFIG
window.charMode = window.charMode || {};
window.charMode.countSpaces = true;
window.charMode.stepChars = 5;
window.charMode.chunkSize = 10; // 10 characters per timing chunk (recommended)
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
window.manualCharOffsetChars = 0;
window._charRenderedSpans = null;
window._charTooltipEl = null;
window._charTooltipTimer = null;

window._charGlobal = {
  chars: [],
  totalChars: 0,
  totalLyricsSeconds: 0,
  segments: [] // each segment: { start, end, duration, startGidx, totalChars, chunks: [...] , lineBounds: [...] }
};

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

  // global start/end across segments (if present)
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

      const endG = gCounted; // after processing this line
      segEntry.lineBounds.push({ segIndex, lineIndex, startGidx: startG, endGidx: endG, cleaned });
    });

    segEntry.totalChars = gCounted - segEntry.startGidx;

    // Create chunks of fixed character-size (last chunk may be smaller)
    const chunkSize = Math.max(1, parseInt(window.charMode.chunkSize || 10, 10));
    const total = segEntry.totalChars;
    const numChunks = total > 0 ? Math.max(1, Math.ceil(total / chunkSize)) : 1;
    const baseChunkDuration = numChunks > 0 ? (segEntry.duration / numChunks) : Infinity;

    for (let c = 0; c < numChunks; c++) {
      const cStart = segEntry.startGidx + c * chunkSize;
      const cEnd = Math.min(segEntry.startGidx + (c + 1) * chunkSize, segEntry.startGidx + total);
      const cChars = Math.max(0, cEnd - cStart);
      const cDur = baseChunkDuration;
      const secondsPerChar = cChars > 0 ? (cDur / cChars) : Infinity;

      segEntry.chunks.push({
        startGidx: cStart,
        endGidx: cEnd,
        totalChars: cChars,
        duration: cDur,
        secondsPerChar
      });
    }

    segments.push(segEntry);
  });

  window._charGlobal = {
    chars,
    totalChars: gCounted,
    totalLyricsSeconds,
    segments
  };
}

// --------------------------------------------------------------
// Render Tamil lyrics with each character wrapped in spans
// (DOM mapping unchanged — keep data-gidx global)
// --------------------------------------------------------------
function renderTamilLyricsCharMode() {
  const box = document.getElementById("tamilLyricsBox");
  if (!box) return;
  box.innerHTML = "";
  window._charRenderedSpans = null;

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
        span.style.background = 'transparent';
        lineEl.appendChild(span);
      }

      segDiv.appendChild(lineEl);
    });

    box.appendChild(segDiv);
  });

  // map chars -> spans (preserve existing mapping behavior)
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
        s.setAttribute('data-gidx', String(entry.countedIndex));
      }
      cursor++;
      break;
    }
  }

  window._charRenderedSpans = box.querySelectorAll('span');
}

// --------------------------------------------------------------
// Highlight up to index (unchanged behavior)
// --------------------------------------------------------------
function applyCharHighlight(finalCountIndex) {
  if (!window._charRenderedSpans) return;

  for (const s of window._charRenderedSpans) {
    const v = s.getAttribute('data-gidx');
    if (!v) {
      s.style.background = window.charMode.normalStyle.background;
      s.style.color = window.charMode.normalStyle.color;
      s.style.fontWeight = window.charMode.normalStyle.fontWeight;
      continue;
    }

    const gidx = parseInt(v, 10);
    if (gidx < finalCountIndex) {
      s.style.background = window.charMode.highlightStyle.background;
      s.style.color = window.charMode.highlightStyle.color;
      s.style.fontWeight = window.charMode.highlightStyle.fontWeight;
    } else {
      s.style.background = window.charMode.normalStyle.background;
      s.style.color = window.charMode.normalStyle.color;
      s.style.fontWeight = window.charMode.normalStyle.fontWeight;
    }
  }
}

// --------------------------------------------------------------
// Scroll support (unchanged)
// --------------------------------------------------------------
function scrollToCharIndex(finalCountIndex) {
  if (!window._charRenderedSpans) return;

  let lastSpan = null;
  for (let i = window._charRenderedSpans.length - 1; i >= 0; i--) {
    const s = window._charRenderedSpans[i];
    const v = s.getAttribute('data-gidx');
    if (!v) continue;
    const gi = parseInt(v, 10);
    if (gi < finalCountIndex) {
      lastSpan = s;
      break;
    }
  }
  if (!lastSpan) return;

  const rect = lastSpan.getBoundingClientRect();
  const offset = 28 * 3;
  const scrollAmount = rect.top - offset;

  const box = document.getElementById('tamilLyricsBox');
  if (box) {
    box.scrollTop += scrollAmount;
  }
}

// --------------------------------------------------------------
// Enable / Disable
// --------------------------------------------------------------
window.enableCharacterMode = function () {
  window.charModeEnabled = true;
  window.manualCharOffsetChars = 0;

  buildGlobalCharArray();
  renderTamilLyricsCharMode();

  const box = document.getElementById("tamilLyricsBox");
  if (box) window._charRenderedSpans = box.querySelectorAll('span');

  // compute start index from audio clock using new per-segment+chunk logic
  const ct = window.vocalAudio?.currentTime || 0;
  updateCharModeHighlight(ct);

  if (box) box.scrollTop = 0;

  _char_insertAdjustButtons();
};

window.disableCharacterMode = function () {
  window.charModeEnabled = false;
  const old = document.getElementById("charModeAdjustButtons");
  if (old) old.remove();
  if (typeof renderTamilLyrics === 'function') renderTamilLyrics();
};

// --------------------------------------------------------------
// MAIN ENGINE — UPDATE PER FRAME WITH CHUNKS (B1 clamping)
// --------------------------------------------------------------
window.updateCharModeHighlight = function (currentTime) {
  if (!window.charModeEnabled) return;

  const g = window._charGlobal;
  if (!g || !Array.isArray(g.segments) || g.segments.length === 0) return;

  // ensure totalChars present
  if (typeof g.totalChars !== 'number') g.totalChars = (g.chars || []).reduce((acc, e) => acc + (e.countsTowardsTotal ? 1 : 0), 0);

  const segments = g.segments;

  // find last segment whose start <= currentTime
  let segIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    if (currentTime >= segments[i].start) segIndex = i;
    else break;
  }

  let finalGlobalIndex = 0;

  if (segIndex === -1) {
    // before first segment
    finalGlobalIndex = 0;
  } else {
    const seg = segments[segIndex];
    const segStart = seg.start;
    const segEnd = seg.end;

    // If the segment has no counted characters, simply clamp to start
    if (!seg.totalChars || seg.totalChars <= 0) {
      finalGlobalIndex = seg.startGidx;
    } else if (currentTime > segEnd) {
      // B1: clamp to last char of this segment until next segment starts
      finalGlobalIndex = seg.startGidx + seg.totalChars;
    } else {
      // inside this segment: map time -> chunk -> local char index
      const rel = Math.max(0, currentTime - segStart);
      const numChunks = Math.max(1, seg.chunks.length);
      const chunkDuration = seg.duration / numChunks;

      // determine which chunk we're in (guard against edge)
      let chunkIndex = Math.floor(rel / (chunkDuration || 1e-9));
      if (chunkIndex < 0) chunkIndex = 0;
      if (chunkIndex >= numChunks) chunkIndex = numChunks - 1;

      const chunk = seg.chunks[chunkIndex];
      const chunkStartTime = chunkIndex * chunkDuration;
      const relInChunk = Math.max(0, rel - chunkStartTime);

      // compute local progress inside chunk
      let baseLocal = 0;
      if (!isFinite(chunk.secondsPerChar) || chunk.secondsPerChar <= 0) {
        baseLocal = 0;
      } else {
        baseLocal = relInChunk / chunk.secondsPerChar;
      }

      const localClamped = Math.max(0, Math.min(baseLocal, chunk.totalChars));
      finalGlobalIndex = chunk.startGidx + Math.floor(localClamped);
    }
  }

  // apply manual offset
  const offsetApplied = finalGlobalIndex + (window.manualCharOffsetChars || 0);

  // clamp to valid global range
  const limited = Math.max(0, Math.min(offsetApplied, g.totalChars));

  applyCharHighlight(Math.floor(limited));
  scrollToCharIndex(Math.floor(limited));

  window.currentGlobalCharIndex = limited;
};

// --------------------------------------------------------------
// Controls (unchanged)
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
// Buttons (unchanged)
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
