// =======================================================
// audioControl.js
// Glow / Boost / Drop for all segments + duplicate protection
// Designed for non-module, globally-included JS files.
// Keeps functions/vars global so songLoader.js can call playSegmentById(segmentId).
// =======================================================

// -----------------------------
// Configuration (tweak if necessary)
// -----------------------------
var AC = AC || {}; // global namespace shorthand (safe)
AC.MIN_VOL = 0.001;                     // minimum audible floor
AC.DEFAULTS = AC.DEFAULTS || { vocal: 0.0025, accomp: 0.02 };
AC.GLOW_MS = 700;                       // glow animation duration (ms)
AC.BOOST_MS = 450;                      // boost ramp duration (ms)
AC.BOOST_HOLD_MS = 300;                 // how long boosted volume holds before dropping (ms)
AC.DROP_MS = 900;                       // drop (fade out) duration (ms)
AC.TOTAL_ANIM_MS = AC.GLOW_MS + AC.BOOST_MS + AC.BOOST_HOLD_MS + AC.DROP_MS + 50;
AC.DUPLICATE_PROTECTION_MS = AC.TOTAL_ANIM_MS; // prevents retrigger while animation active

// -----------------------------
// Global audio element references (expected to exist in DOM)
// The songLoader / index.html should create these <audio> elements with these ids.
// -----------------------------
window.ensureAudioElements = function() {
  window.vocalAudio = window.vocalAudio || document.getElementById('vocalAudio') || document.querySelector('audio[data-role="vocal"]') || null;
  window.accompAudio = window.accompAudio || document.getElementById('accompAudio') || document.querySelector('audio[data-role="accomp"]') || null;

  // Also capture control elements for glow UI. Defaults: <input id="vocalVolume"> and <input id="accompVolume"> exist.
  AC._vocalControl = AC._vocalControl || document.getElementById('vocalVolume') || document.querySelector('.volume-control input[id="vocalVolume"]') || null;
  AC._accompControl = AC._accompControl || document.getElementById('accompVolume') || document.querySelector('.volume-control input[id="accompVolume"]') || null;

  // Parent nodes to apply glow (fall back to the input itself if parent not found)
  AC._vocalGlowTarget = AC._vocalControl ? (AC._vocalControl.parentElement || AC._vocalControl) : null;
  AC._accompGlowTarget = AC._accompControl ? (AC._accompControl.parentElement || AC._accompControl) : null;
};
ensureAudioElements();

// -----------------------------
// State for duplicate protection / active animations
// -----------------------------
AC._lastTriggeredAt = {};   // map: segmentId -> timestamp ms when animation started
AC._activeAnimations = {};  // map: segmentId -> boolean (true while animation running)
AC._currentSegment = null;  // last segment id reported as "current" (optional use)
AC._globalLock = false;     // safety lock if you want to temporarily block all animations

// -----------------------------
// Utility: safe number clamp
// -----------------------------
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// -----------------------------
// Volume control functions (global)
// Exposed: adjustVolume(channel, delta)  -> for your +/- buttons
//           setVolume(channel, value)    -> immediate set (0..1)
// -----------------------------
window.adjustVolume = window.adjustVolume || function(channel, delta) {
  ensureAudioElements();
  var input = (channel === 'vocal') ? AC._vocalControl : AC._accompControl;
  if (!input) return;
  var step = delta;
  var newVal = parseFloat(input.value || input.getAttribute('data-vol') || 0) + step;
  newVal = clamp(newVal, AC.MIN_VOL, 1.0);
  input.value = newVal;
  input.setAttribute('data-vol', newVal);
  // apply to audio element if present
  var audio = (channel === 'vocal') ? window.vocalAudio : window.accompAudio;
  if (audio) audio.volume = newVal;
};

window.setVolume = window.setVolume || function(channel, value) {
  ensureAudioElements();
  var v = clamp(parseFloat(value), AC.MIN_VOL, 1.0);
  var input = (channel === 'vocal') ? AC._vocalControl : AC._accompControl;
  if (input) { input.value = v; input.setAttribute('data-vol', v); }
  var audio = (channel === 'vocal') ? window.vocalAudio : window.accompAudio;
  if (audio) audio.volume = v;
};

// -----------------------------
// Internal: ramp volume smoothly over duration (ms)
// - Uses linear steps set by requestAnimationFrame
// - Cancels any previous ramp on the same audio element.
// -----------------------------
AC._rampControllers = {}; // map audioElement -> { cancel: fn }

AC.rampVolume = function(audioEl, fromVol, toVol, durationMs, onComplete) {
  if (!audioEl) { if (onComplete) onComplete(); return; }
  // cancel existing ramp
  var id = audioEl._ac_ramp_id || ('ramp_' + Math.random());
  if (AC._rampControllers[id] && AC._rampControllers[id].cancel) {
    AC._rampControllers[id].cancel();
  }
  audioEl._ac_ramp_id = id;

  var start = performance.now();
  var cancelled = false;
  AC._rampControllers[id] = {
    cancel: function() { cancelled = true; }
  };

  var step = function(now) {
    if (cancelled) return;
    var t = (now - start) / durationMs;
    if (t >= 1) {
      audioEl.volume = clamp(toVol, AC.MIN_VOL, 1.0);
      if (onComplete) onComplete();
      delete AC._rampControllers[id];
      return;
    }
    var cur = fromVol + (toVol - fromVol) * t;
    audioEl.volume = clamp(cur, AC.MIN_VOL, 1.0);
    requestAnimationFrame(step);
  };
  // ensure starting volume immediately
  audioEl.volume = clamp(fromVol, AC.MIN_VOL, 1.0);
  requestAnimationFrame(step);
};

// -----------------------------
// UI Glow helpers (applies to parent container or control)
// -----------------------------
// We'll toggle an inline style so you don't need extra CSS files. Keeps the warm gold -> peaceful blue visual.
// Feel free to override with your CSS class if you prefer.
// -----------------------------
AC._applyGlow = function(targetEl, ms) {
  if (!targetEl) return function() {};
  // Save original inline style to restore later
  var prevBox = targetEl.style.boxShadow || '';
  var prevTransition = targetEl.style.transition || '';

  // glow effect: gentle outer glow then fade
  targetEl.style.transition = "box-shadow " + (ms/1000) + "s ease";
  // warm gold -> peaceful blue mix
  targetEl.style.boxShadow = "0 0 18px 6px rgba(255,200,80,0.20), 0 0 36px 8px rgba(120,170,255,0.12)";

  var undone = false;
  var undo = function() {
    if (undone) return;
    undone = true;
    // restore back after a tiny delay so transition plays
    setTimeout(function() {
      targetEl.style.boxShadow = prevBox;
      targetEl.style.transition = prevTransition;
    }, 10);
  };
  // Automatically undo after ms (safety)
  setTimeout(undo, ms + 30);
  return undo;
};

// -----------------------------
// Core: perform Glow -> Boost -> Drop for a given channel for a given segmentId
// - segmentId: any string/number identifying the segment
// - channel: 'vocal' or 'accomp' or 'both'
// - options: { manual: true/false } (manual taps allowed)
// -----------------------------
window.triggerSegmentAnimation = window.triggerSegmentAnimation || function(segmentId, channel, options) {
  ensureAudioElements();
  options = options || {};
  var now = Date.now();
  var segKey = String(segmentId || 'seg_undefined');

  // global early exit if locked
  if (AC._globalLock) return;

  // Duplicate protection: if animation active for this segment, ignore.
  if (AC._activeAnimations[segKey]) {
    // already animating for this segment -> skip to avoid overlapping retriggers
    // This allows manual re-trigger later once animation finishes.
    return;
  }

  // mark active and record time
  AC._activeAnimations[segKey] = true;
  AC._lastTriggeredAt[segKey] = now;
  AC._currentSegment = segKey;

  // Helper to run on a specific audio element + control
  var runFor = function(channelName) {
    var audio = (channelName === 'vocal') ? window.vocalAudio : window.accompAudio;
    var controlTarget = (channelName === 'vocal') ? AC._vocalGlowTarget : AC._accompGlowTarget;
    var inputElem = (channelName === 'vocal') ? AC._vocalControl : AC._accompControl;
    // get baseline volume (prefer current audio.volume else stored input value else default)
    var baseline = AC.MIN_VOL;
    if (audio && (typeof audio.volume === 'number')) baseline = Math.max(AC.MIN_VOL, audio.volume);
    else if (inputElem) baseline = Math.max(AC.MIN_VOL, parseFloat(inputElem.getAttribute('data-vol') || inputElem.value || AC.DEFAULTS[channelName] || AC.MIN_VOL));
    else baseline = AC.DEFAULTS[channelName] || AC.MIN_VOL;

    // Apply glow immediately (visual)
    var undoGlow = AC._applyGlow(controlTarget || inputElem, AC.GLOW_MS);

    // BOOST: ramp up from baseline to a computed boosted value quickly
    var boostTarget = clamp(baseline * 3.0 + 0.001, AC.MIN_VOL, 1.0); // multiplier-based boost (tweakable)
    var boostStart = AC.BOOST_MS;
    var dropStartDelay = AC.BOOST_MS + AC.BOOST_HOLD_MS;

    // If no audio element present, still run visual glow but skip volume ramps.
    if (!audio) {
      // schedule cleanup after full anim duration
      setTimeout(function() {
        if (typeof undoGlow === 'function') undoGlow();
      }, AC.TOTAL_ANIM_MS);
      return;
    }

    // Cancel any existing ramps on this audio element to avoid overlap
    try { AC._rampControllers[audio._ac_ramp_id] && AC._rampControllers[audio._ac_ramp_id].cancel(); } catch(e){}

    // Immediate boost ramp
    AC.rampVolume(audio, baseline, boostTarget, AC.BOOST_MS, function() {
      // Hold at boosted value for BOOST_HOLD_MS, then drop
      setTimeout(function() {
        // drop back to baseline gracefully
        AC.rampVolume(audio, boostTarget, baseline, AC.DROP_MS, function() {
          // done for this channel
        });
      }, AC.BOOST_HOLD_MS);
    });
  }; // runFor

  // Run for requested channel(s)
  if (channel === 'both' || channel === undefined || channel === null) {
    runFor('vocal');
    runFor('accomp');
  } else if (channel === 'vocal' || channel === 'accomp') {
    runFor(channel);
  }

  // After total animation time, clear active flag so the same segment can be triggered again.
  setTimeout(function() {
    AC._activeAnimations[segKey] = false;
  }, AC.TOTAL_ANIM_MS);
};

// -----------------------------
// Public convenience wrapper used by songLoader.js
// - call window.playSegmentById(segmentId, opts)
//    opts = { channel: 'vocal'|'accomp'|'both', manual: true|false }
// -----------------------------
window.playSegmentById = window.playSegmentById || function(segmentId, opts) {
  opts = opts || {};
  var channel = opts.channel || 'both';
  // We intentionally allow manual tapping or automatic calls to invoke the same animation logic.
  // Duplicate protection prevents overlapping animations if called again before previous finishes.
  triggerSegmentAnimation(segmentId, channel, { manual: !!opts.manual });

  // Keep backwards compatibility: if songLoader previously expected a function named audioControlPlay or similar,
  // you can create a shim here. (Add shims below if needed.)
};

// -----------------------------
// Optional: function to forcibly cancel any active animations (useful for abrupt UI changes)
// -----------------------------
window.cancelAllSegmentAnimations = window.cancelAllSegmentAnimations || function() {
  AC._globalLock = true;
  // clear per-segment active flags after small timeout
  setTimeout(function() {
    for (var k in AC._activeAnimations) { if (AC._activeAnimations.hasOwnProperty(k)) AC._activeAnimations[k] = false; }
    AC._globalLock = false;
  }, 50);
};

// -----------------------------
// Backwards-compatibility shims (if older code calls these names)
// -----------------------------
window.triggerGlowBoostDrop = window.triggerGlowBoostDrop || function(segmentId) {
  playSegmentById(segmentId, { channel: 'both' });
};

// -----------------------------
// Initialization: ensure everything wired after DOM ready
// -----------------------------
(function initAudioControlOnReady() {
  // Attempt to pick up elements when DOM ready; if this script is loaded after DOM, this runs immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ensureAudioElements();
      // if you want to preset volumes based on inputs on load:
      if (AC._vocalControl) {
        var v = parseFloat(AC._vocalControl.getAttribute('data-vol') || AC._vocalControl.value || AC.DEFAULTS.vocal);
        if (window.vocalAudio) window.vocalAudio.volume = clamp(v, AC.MIN_VOL, 1.0);
      }
      if (AC._accompControl) {
        var a = parseFloat(AC._accompControl.getAttribute('data-vol') || AC._accompControl.value || AC.DEFAULTS.accomp);
        if (window.accompAudio) window.accompAudio.volume = clamp(a, AC.MIN_VOL, 1.0);
      }
    });
  } else {
    ensureAudioElements();
  }
})();

// -----------------------------
// End of file
// -----------------------------
