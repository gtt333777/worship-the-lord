// WorshipApp_Modular/songLoader.js

// Global audio elements (expose on window for other scripts)
window.vocalAudio = new Audio();
window.accompAudio = new Audio();

// Flags used for the Play→Segment1 handshake
window.wantAutoSegment1 = false;      // set true when user presses Play
window.audioReadyPromise = null;      // resolves when both tracks have started

// === Utility: Wait until both tracks are ready, then play together ===
// NOTE: keep this name; loopPlayer.js uses a DIFFERENT name to avoid collision.
function checkReadyAndPlay() {
  return new Promise((resolve) => {
    let vocalReady = window.vocalAudio.readyState >= 2;
    let accompReady = window.accompAudio.readyState >= 2;

    const tryPlay = () => {
      if (vocalReady && accompReady) {
        Promise.all([
          window.vocalAudio.play().catch(err => console.error("❌ Vocal play error:", err)),
          window.accompAudio.play().catch(err => console.error("❌ Accompaniment play error:", err))
        ]).then(() => {
          console.log("✅ Both audio tracks started in sync.");
          resolve();
        });
      }
    };

    if (!vocalReady) {
      window.vocalAudio.addEventListener("canplaythrough", () => {
        vocalReady = true; tryPlay();
      }, { once: true });
    }
    if (!accompReady) {
      window.accompAudio.addEventListener("canplaythrough", () => {
        accompReady = true; tryPlay();
      }, { once: true });
    }

    // If both were already ready, start immediately
    tryPlay();
  });
}

// === Play/Pause ===
document.getElementById("playBtn").addEventListener("click", () => {
  console.log("▶️ Play button clicked");

  if (!ACCESS_TOKEN) {
    console.error("❌ ACCESS_TOKEN not yet loaded.");
    return;
  }

  const songName = document.getElementById("songSelect").value;
  if (!songName) {
    console.warn("⚠️ No song selected.");
    return;
  }

  const vocalUrl = getDropboxFileURL(songName + "_vocal.mp3");
  const accUrl   = getDropboxFileURL(songName + "_acc.mp3");

  // Set sources
  window.vocalAudio.src = vocalUrl;
  window.accompAudio.src = accUrl;

  // Only load when play is pressed
  window.vocalAudio.preload = "auto";
  window.accompAudio.preload = "auto";

  // Warm both tracks and set a promise we can await here
  window.audioReadyPromise = checkReadyAndPlay();

  // Also wait until loop JSON is loaded (poll up to ~2s)
  const waitSegments = new Promise((resolve) => {
    if (window.segments && window.segments.length > 0) return resolve();
    const t0 = Date.now();
    const t = setInterval(() => {
      if (window.segments && window.segments.length > 0) { clearInterval(t); resolve(); }
      else if (Date.now() - t0 > 2000) { clearInterval(t); resolve(); }
    }, 50);
  });

  // When both tracks have started AND segments are known, start Segment 1 via the segment path
  Promise.all([window.audioReadyPromise, waitSegments]).then(() => {
    if (!window.segments || window.segments.length === 0) {
      console.warn("⚠️ No segments loaded yet; cannot start Segment 1.");
      return;
    }
    const seg = window.segments[0];
    console.log("🎯 Play routed to Segment 1 (strict path)");
    window.playSegment(seg.start, seg.end, 0);
  });
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  console.log("⏸️ Pause button clicked");
  window.vocalAudio.pause();
  window.accompAudio.pause();
});

// === Song dropdown change: just set the textarea lyrics; loop JSON is fetched in loopPlayer.js ===
document.addEventListener("DOMContentLoaded", () => {
  const dd = document.getElementById("songSelect");
  const lyricsArea = document.getElementById("lyricsText");
  if (!dd || !lyricsArea) return;

  dd.addEventListener("change", () => {
    const selected = dd.value;
    if (!selected) return;

    fetch(`lyrics/${selected}.txt`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error("Lyrics not found")))
      .then(txt => { lyricsArea.value = txt; })
      .catch(err => { console.warn("⚠️ Could not load lyrics:", err); });
  });
});

// === Stop & Unload Function ===
function stopAndUnloadAudio() {
  // Pause both
  window.vocalAudio.pause();
  window.accompAudio.pause();

  // Reset position
  window.vocalAudio.currentTime = 0;
  window.accompAudio.currentTime = 0;

  // Remove src to free memory & stop buffering
  window.vocalAudio.removeAttribute("src");
  window.accompAudio.removeAttribute("src");

  // Force unload
  window.vocalAudio.load();
  window.accompAudio.load();

  console.log("🛑 Audio stopped and unloaded from memory.");
}

// === Dropbox URL Builder ===
function getDropboxFileURL(filename) {
  const dropboxPath = "/WorshipSongs/" + filename;
  return `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${ACCESS_TOKEN}&arg={"path":"${dropboxPath}"}`;
}





//paste this whole block at the very end of songLoader.js 

/* ==========================================================
   🎛️ Optional: Offline Prefetch Mode (drop-in, no handler edits)
   - Set window.USE_OFFLINE_PREFETCH = true to enable
   - Fully downloads vocal & accomp, then plays from Blob URLs
   - Zero changes to your existing Play click handler
   ========================================================== */


(function () {
  if (window.__OFFLINE_PREFETCH_PATCH__) return;
  window.__OFFLINE_PREFETCH_PATCH__ = true;

  // OFF by default. Flip true to try:
  //window.USE_OFFLINE_PREFETCH = window.USE_OFFLINE_PREFETCH ?? false;

  // Persisted default (ON by default; remembered in localStorage)
const __stored = localStorage.getItem('use_offline_prefetch');
window.USE_OFFLINE_PREFETCH = __stored === null ? true : (__stored === 'true');

// Optional helper to change it once and remember
window.setOfflinePrefetch = function(on){
  const v = !!on; localStorage.setItem('use_offline_prefetch', String(v));
  window.USE_OFFLINE_PREFETCH = v;
  console.log('Offline prefetch is now', v ? 'ON' : 'OFF');
};



  // Helpers
  function getSelectedSongName() {
    var dd = document.getElementById('songSelect');
    return dd && dd.value ? dd.value : '';
  }

  async function fetchToBlob(url, onProgress) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Download failed: ' + url);
    const total = Number(resp.headers.get('content-length')) || 0;
    const reader = resp.body.getReader();
    const chunks = [];
    let recvd = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      recvd += value.byteLength;
      if (onProgress && total) onProgress(recvd, total);
    }
    const blob = new Blob(chunks, { type: resp.headers.get('content-type') || 'audio/mpeg' });
    return blob;
  }

  function getDropboxURLFor(name, suffix) {
    // mirror your getDropboxFileURL logic
    const filename = name + suffix;
    const dropboxPath = "/WorshipSongs/" + filename;
    return `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${ACCESS_TOKEN}&arg=${encodeURIComponent(JSON.stringify({path: dropboxPath}))}`;
  }

  async function preDownloadBothTracks() {
    const song = getSelectedSongName();
    if (!song) throw new Error('No song selected');

    const vocalUrl = getDropboxURLFor(song, "_vocal.mp3");
    const accUrl   = getDropboxURLFor(song, "_acc.mp3");

    console.log('⬇️ Offline prefetch: starting downloads...');
    const [vBlob, aBlob] = await Promise.all([
      fetchToBlob(vocalUrl, (got, tot) => console.log(`Vocal ${((got/tot)*100|0)}%`)),
      fetchToBlob(accUrl,   (got, tot) => console.log(`Accomp ${((got/tot)*100|0)}%`)),
    ]);

    // Swap to Blob URLs
    const vObj = URL.createObjectURL(vBlob);
    const aObj = URL.createObjectURL(aBlob);

    window.vocalAudio.pause();
    window.accompAudio.pause();

    window.vocalAudio.src = vObj;
    window.accompAudio.src = aObj;

    // Keep refs to revoke later if you stop/unload
    window.__offline_vocal_obj = vObj;
    window.__offline_accomp_obj = aObj;

    console.log('✅ Offline prefetch complete; sources swapped to Blob URLs.');
  }

  // Hook checkReadyAndPlay so the Play flow stays unchanged
  const __origCheckReadyAndPlay = window.checkReadyAndPlay;
  window.checkReadyAndPlay = async function() {
    if (window.USE_OFFLINE_PREFETCH) {
      try {
        await preDownloadBothTracks();
      } catch (e) {
        console.warn('Offline prefetch failed; falling back to streaming:', e);
      }
    }
    return __origCheckReadyAndPlay.call(this);
  };

  // Optional: when you call stopAndUnloadAudio(), also revoke Blob URLs
  const __origStopUnload = window.stopAndUnloadAudio;
  window.stopAndUnloadAudio = function() {
    try { __origStopUnload && __origStopUnload.call(this); } catch(_){}
    try { if (window.__offline_vocal_obj) URL.revokeObjectURL(window.__offline_vocal_obj); } catch(_){}
    try { if (window.__offline_accomp_obj) URL.revokeObjectURL(window.__offline_accomp_obj); } catch(_){}
    window.__offline_vocal_obj = null;
    window.__offline_accomp_obj = null;
  };

  console.log('🎛️ Offline Prefetch Mode ready. Set window.USE_OFFLINE_PREFETCH = true to use.');
})();
</script>


*/