document.addEventListener('DOMContentLoaded', function () {
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");

  const vocalVolumeDown = document.getElementById("vocalVolumeDown");
  const vocalVolumeUp = document.getElementById("vocalVolumeUp");
  const accompVolumeDown = document.getElementById("accompVolumeDown");
  const accompVolumeUp = document.getElementById("accompVolumeUp");

  const rewind1 = document.getElementById("rewind1");
  const forward1 = document.getElementById("forward1");

  playButton.addEventListener("click", function () {
    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.play();
      window.accompAudio.play();

      // ✅ Manually trigger loop segment playback
      if (typeof window.startLoopSequence === "function") {
        console.log("🎯 audioControl.js: Triggering startLoopSequence from Play button.");
        window.startLoopSequence(window.vocalAudio, window.accompAudio);
      } else {
        console.warn("⚠️ startLoopSequence function not found.");
      }
    } else {
      console.warn("⚠️ Audio elements not found.");
    }
  });

  pauseButton.addEventListener("click", function () {
    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.pause();
      window.accompAudio.pause();
    }
  });

  vocalVolumeDown.addEventListener("click", function () {
    if (window.vocalAudio) {
      window.vocalAudio.volume = Math.max(0, window.vocalAudio.volume - 0.1);
    }
  });

  vocalVolumeUp.addEventListener("click", function () {
    if (window.vocalAudio) {
      window.vocalAudio.volume = Math.min(1, window.vocalAudio.volume + 0.1);
    }
  });

  accompVolumeDown.addEventListener("click", function () {
    if (window.accompAudio) {
      window.accompAudio.volume = Math.max(0, window.accompAudio.volume - 0.1);
    }
  });

  accompVolumeUp.addEventListener("click", function () {
    if (window.accompAudio) {
      window.accompAudio.volume = Math.min(1, window.accompAudio.volume + 0.1);
    }
  });

  rewind1.addEventListener("click", function () {
    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.currentTime = Math.max(0, window.vocalAudio.currentTime - 1);
      window.accompAudio.currentTime = Math.max(0, window.accompAudio.currentTime - 1);
    }
  });

  forward1.addEventListener("click", function () {
    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.currentTime += 1;
      window.accompAudio.currentTime += 1;
    }
  });
});
