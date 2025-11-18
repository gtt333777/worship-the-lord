// ===============================================================
// lyricsViewer_charMode.js  (FINAL — WITH EXACT TIME → CHARACTER MATCH)
// ===============================================================

// CONFIG
window.charMode = window.charMode || {};
window.charMode.countSpaces = true;
window.charMode.stepChars = 50;
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
  totalSeconds: 0,
  secondsPerChar: 0,
  lineBounds: []
};

// --------------------------------------------------------------
// Clean Tamil line
// --------------------------------------------------------------
function _char_cleanTamilLine(line) {
  if (typeof cleanTamilLine === 'function') return cleanTamilLine(line);
  if (!line || typeof line !== 'string') return '';
  const matches = line.match(/[\u0B80-\u0BFF\u00A0\u0020]/g);
  if (!matches) return '';
  return matches.join('').replace(/\s+/g, ' ').trim();
}

// --------------------------------------------------------------
// Build global character array AND compute secondsPerChar
// --------------------------------------------------------------
function buildGlobalCharArray() {
  const raw = window.lyricsData;
  if (!raw || !Array.isArray(raw.tamilSegments)) {
    window._charGlobal = {
      chars: [],
      totalChars: 0,
      totalSeconds: 0,
      secondsPerChar: 0,
      lineBounds: []
    };
    return;
  }

  const chars = [];
  const lineBounds = [];
  let gCountedIndex = 0;
  let totalSeconds = 0;

  raw.tamilSegments.forEach((seg, segIndex) => {
    const segDuration = Math.max(0,
      (typeof seg.end === 'number' && typeof seg.start === 'number')
        ? seg.end - seg.start
        : 0
    );
    totalSeconds += segDuration;

    (seg.lyrics || []).forEach((line, lineIndex) => {
      const cleaned = _char_cleanTamilLine(line) || '\u00A0';
      const startG = gCountedIndex;

      for (let li = 0; li < cleaned.length; li++) {
        const ch = cleaned[li];
        const counts = !(ch === ' ' && !window.charMode.countSpaces);

        chars.push({
          ch,
          segIndex,
          lineIndex,
          localIndex: li,
          countedIndex: counts ? gCountedIndex : null,
          countsTowardsTotal: counts
        });

        if (counts) gCountedIndex++;
      }

      const endG = gCountedIndex;
      lineBounds.push({ segIndex, lineIndex, startGidx: startG, endGidx: endG, cleaned });
    });
  });

  const totalChars = gCountedIndex;

  // ***************************************************
  // FINAL PATCH #1 — correct secondsPerChar
  // ***************************************************
  const firstStart = raw.tamilSegments[0].start;
  const lastEnd = raw.tamilSegments[raw.tamilSegments.length - 1].end;
  const totalLyricsSeconds = lastEnd - firstStart;

  const secondsPerChar = totalChars > 0
    ? (totalLyricsSeconds / totalChars)
    : 0;

  window._charGlobal = {
    chars,
    totalChars,
    totalLyricsSeconds,
    secondsPerChar,
    lineBounds
  };
}

// --------------------------------------------------------------
// Render Tamil lyrics with each character wrapped in spans
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

    (seg.lyrics || []).forEach((line, lineIndex) => {
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

  // map chars → spans
  const spanList = box.querySelectorAll('span');
  let cursor = 0;
  const gchars = window._charGlobal.chars;

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
// Highlight up to index
// --------------------------------------------------------------
function applyCharHighlight(finalCountIndex) {
  if (!window._charRenderedSpans) return;

  for (const s of window._charRenderedSpans) {
    const v = s.getAttribute('data-gidx');
    if (!v) {
      s.style.background = window.charMode.normalStyle.background;
      s.style.color = window.charMode.normalStyle.color;
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
// Scroll support
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

  window.scrollBy({
    top: rect.top - offset,
    behavior: 'smooth'
  });
}

// --------------------------------------------------------------
// FINAL PATCH #2 — on CHAR toggle, jump to exact correct index
// --------------------------------------------------------------
window.enableCharacterMode = function () {
  window.charModeEnabled = true;
  window.manualCharOffsetChars = 0;

  buildGlobalCharArray();
  renderTamilLyricsCharMode();

  const box = document.getElementById("tamilLyricsBox");
  if (box) window._charRenderedSpans = box.querySelectorAll('span');

  // compute start index from audio clock
  const firstStart = window.lyricsData.tamilSegments[0].start;
  const ct = window.vocalAudio?.currentTime || 0;
  const lyricTime = Math.max(0, ct - firstStart);

  const spc = window._charGlobal.secondsPerChar || 1;
  const index = lyricTime / spc;

  window.globalCharIndex = index;
  applyCharHighlight(Math.floor(index));

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
// FINAL PATCH #3 — audio loop update EXACT match
// --------------------------------------------------------------
window.updateCharModeHighlight = function (currentTime) {
  if (!window.charModeEnabled) return;

  const g = window._charGlobal;
  if (!g.secondsPerChar || g.secondsPerChar <= 0) return;

  const firstStart = window.lyricsData.tamilSegments[0].start;
  const lyricTime = Math.max(0, currentTime - firstStart);

  const base = lyricTime / g.secondsPerChar;
  const finalIndex = base + (window.manualCharOffsetChars || 0);

  const limited = Math.max(0, Math.min(finalIndex, g.totalChars));

  applyCharHighlight(Math.floor(limited));
  scrollToCharIndex(Math.floor(limited));

  window.currentGlobalCharIndex = limited;
};

// --------------------------------------------------------------
// Controls
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
// Buttons
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
