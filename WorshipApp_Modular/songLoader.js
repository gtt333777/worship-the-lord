console.log("🎵 songLoader.js: Starting (R2 + smart caching + progressive preloading)...");

// 🎵 Global audio players
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

/* ==========================================================
   SMART CACHE FETCHER (works for Cloudflare R2)
   ========================================================== */
async function fetchWithCache(url) {
  const CACHE_NAME = "worship-audio-cache-v2";
  if (!url) return "";

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      console.log("💾 Loaded from cache:", url);
      return URL.createObjectURL(await cachedResponse.blob());
    }

    console.log("🌐 Fetching from R2:", url);
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Network fetch failed");

    cache.put(url, response.clone());
    console.log("📦 Cached:", url);

    return URL.createObjectURL(await response.blob());
  } catch (err) {
    console.error("⚠️ fetchWithCache failed:", err);
    return url; // fallback to direct URL
  }
}

/* ==========================================================
   SEGMENT WARMERS (Progressive Loading)
   ========================================================== */
window.segmentWarmers = window.segmentWarmers || {};

async function createSegmentWarmerForIndex(index, startTime) {
  try {
    if (!window.vocalAudio || !window.accompAudio) return;
    if (window.segmentWarmers[index]) return;

    const vocalSource = window.vocalAudio.currentSrc || window.vocalAudio.src;
    const accompSource = window.accompAudio.currentSrc || window.accompAudio.src;
    if (!vocalSource || !accompSource) return;

    const [vUrl, aUrl] = await Promise.all([
      fetchWithCache(vocalSource),
      fetchWithCache(accompSource)
    ]);

    const v = new Audio(vUrl);
    const a = new Audio(aUrl);
    [v, a].forEach(el => {
      el.preload = "auto";
      el.muted = true;
      el.playsInline = true;
    });

    window.segmentWarmers[index] = { v, a, createdAt: Date.now(), startTime };
    (document.body || document.documentElement).appendChild(v);
    (document.body || document.documentElement).appendChild(a);

    const once = (el, ev) =>
      new Promise(res =>
        el.readyState >= 1 ? res() : el.addEventListener(ev, () => res(), { once: true })
      );

    await Promise.all([once(v, "loadedmetadata"), once(a, "loadedmetadata")]);
    const SEEK_NUDGE = 0.001;
    v.currentTime = Math.max(0, startTime + SEEK_NUDGE);
    a.currentTime = Math.max(0, startTime + SEEK_NUDGE);

    const onceSeeked = (el) =>
      new Promise(res =>
        el.readyState >= 2 ? res() : el.addEventListener("seeked", () => res(), { once: true })
      );

    await Promise.all([onceSeeked(v), onceSeeked(a)]);

    Promise.allSettled([v.play(), a.play()]).finally(() => {
      setTimeout(() => {
        try { v.pause(); a.pause(); } catch (_) {}
      }, 120); // warm-up duration
    });

    console.log(`🔥 Preloaded segment ${index + 1} at ${startTime}s`);
  } catch (err) {
    console.warn("⚠️ createSegmentWarmerForIndex failed:", err);
  }
}

function cleanupOldWarmers(maxAgeMs = 3 * 60 * 1000) {
  const now = Date.now();
  Object.keys(window.segmentWarmers).forEach(k => {
    const o = window.segmentWarmers[k];
    if (now - (o.createdAt || 0) > maxAgeMs) {
      try { o.v.pause(); o.v.remove(); o.a.pause(); o.a.remove(); } catch (_) {}
      delete window.segmentWarmers[k];
    }
  });
}

/* ==========================================================
   LOAD SELECTED SONG (with loading indicator + first segment warm)
   ========================================================== */
async function loadSelectedSong(songName) {
  console.log(`🎵 Song selected -> ${songName}`);
  const entry = window.songURLs[songName];
  if (!entry) return console.error("❌ No entry for", songName);

  const { vocalURL, accURL } = entry;

  // 🔄 Show loading indicator
  document.getElementById("loadingIndicator").style.display = "block";

  stopAndUnloadAudio();

  try {
    // Fetch and load audio with caching
    window.vocalAudio.src = await fetchWithCache(vocalURL);
    window.accompAudio.src = await fetchWithCache(accURL);

    // Hide loading indicator when ready
    document.getElementById("loadingIndicator").style.display = "none";

    window.vocalAudio.preload = "auto";
    window.accompAudio.preload = "auto";

    // ✅ Prepare audioReadyPromise (for sync with loopPlayer.js)
    window.audioReadyPromise = new Promise((resolve) => {
      const check = () => {
        if (
          window.vocalAudio.readyState >= 2 &&
          window.accompAudio.readyState >= 2
        ) resolve();
        else setTimeout(check, 150);
      };
      check();
    });

    // Ask loopPlayer to auto-start Segment 1
    window.wantAutoSegment1 = true;

    // When audio ready, warm first segment
    window.audioReadyPromise.then(() => {
      const tryWarmFirst = () => {
        if (Array.isArray(window.segments) && window.segments.length > 0) {
          createSegmentWarmerForIndex(0, window.segments[0].start);
        } else setTimeout(tryWarmFirst, 200);
      };
      tryWarmFirst();
    });

    // === Fetch lyrics ===
    const lyricsFile = `lyrics/${songName}.txt`;
    const res = await fetch(lyricsFile);
    if (!res.ok) throw new Error("Lyrics not found");
    const txt = await res.text();
    const area = document.getElementById("lyricsArea");
    if (area) area.value = txt;
    console.log("✅ Lyrics loaded");

  } catch (err) {
    console.warn("⚠️ Error loading song:", err);
    const area = document.getElementById("lyricsArea");
    if (area) area.value = "";
    document.getElementById("loadingIndicator").style.display = "none";
  }
}

/* ==========================================================
   STOP / PLAY / PAUSE HANDLERS
   ========================================================== */
function stopAndUnloadAudio() {
  window.vocalAudio.pause();
  window.accompAudio.pause();
  window.vocalAudio.currentTime = 0;
  window.accompAudio.currentTime = 0;
  window.vocalAudio.removeAttribute("src");
  window.accompAudio.removeAttribute("src");
  window.vocalAudio.load();
  window.accompAudio.load();
  console.log("🛑 Audio stopped and unloaded");
}

/* ==========================================================
   PLAY FIRST SEGMENT
   ========================================================== */
async function playFirstSegment() {
  const select = document.getElementById("songSelect");
  if (!select) return;
  const songName = select.value;
  if (!songName) return console.warn("⚠️ No song selected");

  await loadSelectedSong(songName);

  const segment = window.segments[0];
  if (!segment) return console.error("❌ First segment not found");

  playSegment(segment.start, segment.end, 0);
}

/* ==========================================================
   SEGMENT PLAYBACK (progressive loading for next segment)
   ========================================================== */
function playSegment(startTime, endTime, index) {
  console.log(`🎵 Playing segment: ${startTime} → ${endTime} (${(endTime - startTime).toFixed(2)}s)`);

  window.vocalAudio.currentTime = startTime;
  window.accompAudio.currentTime = startTime;

  window.vocalAudio.play().catch((e) => console.error("🎤 Vocal play error:", e));
  window.accompAudio.play().catch((e) => console.error("🎸 Acc play error:", e));

  // Preload next segment early
  try {
    const nextIdx = index + 1;
    if (Array.isArray(window.segments) && window.segments[nextIdx]) {
      const next = window.segments[nextIdx];
      createSegmentWarmerForIndex(nextIdx, next.start);
      cleanupOldWarmers();
    }
  } catch (_) {}

  const EPS = 0.02;
  const DRIFT = 0.06;

  window.activeSegmentInterval = setInterval(() => {
    const diff = Math.abs(window.vocalAudio.currentTime - window.accompAudio.currentTime);
    if (diff > DRIFT) {
      window.accompAudio.currentTime = window.vocalAudio.currentTime;
    }

    if (window.vocalAudio.currentTime >= endTime - EPS) {
      clearInterval(window.activeSegmentInterval);
      window.activeSegmentInterval = null;

      window.vocalAudio.pause();
      window.accompAudio.pause();

      // Auto-advance
      if (index < window.segments.length - 1) {
        const next = window.segments[index + 1];
        playSegment(next.start, next.end, index + 1);
      }
    }
  }, 50);
}

/* ==========================================================
   BUTTON EVENTS
   ========================================================== */
document.getElementById("playBtn").addEventListener("click", playFirstSegment);
document.getElementById("pauseBtn").addEventListener("click", () => {
  window.vocalAudio.pause();
  window.accompAudio.pause();
  console.log("⏸️ Paused both tracks");
});

/* ==========================================================
   CLEAR CACHE MANUALLY
   ========================================================== */
async function clearAudioCache() {
  const CACHE_NAME = "worship-audio-cache-v2";
  const ok = confirm("🧹 Delete cached MP3s?");
  if (!ok) return;
  await caches.delete(CACHE_NAME);
  alert("✅ Cache cleared");
}
