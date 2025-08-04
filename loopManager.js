// loopManager.js
console.log("🎬 loopManager.js: Starting");

document.addEventListener("DOMContentLoaded", () => {
  const interval = setInterval(() => {
    const songSelect = document.getElementById("songSelect");
    const loopButtonsContainer = document.getElementById("loopButtonsContainer");

    if (!songSelect || !loopButtonsContainer) {
      console.warn("⏳ loopManager.js: Waiting for #songSelect and #loopButtonsContainer...");
      return;
    }

    clearInterval(interval);
    console.log("✅ loopManager.js: Found required DOM elements");

    let loopData = [];
    let currentLoopIndex = -1;
    let isPlayingSegment = false;

    let vocalAudio, accompAudio;

    function loadAudioRefs() {
      vocalAudio = document.getElementById("vocalAudio");
      accompAudio = document.getElementById("accompAudio");
      if (!vocalAudio || !accompAudio) {
        console.warn("⚠️ loopManager.js: Audio elements not found yet. Waiting...");
        return false;
      }
      return true;
    }

    songSelect.addEventListener("change", async () => {
      const songName = songSelect.value.trim();
      const loopFile = `lyrics/${songName}_loops.json`;

      loopButtonsContainer.innerHTML = "";
      loopData = [];
      currentLoopIndex = -1;
      isPlayingSegment = false;

      console.log(`📥 loopManager.js: Fetching ${loopFile}`);

      try {
        const response = await fetch(loopFile);
        if (!response.ok) throw new Error("Loop file not found");

        loopData = await response.json();
        console.log(`✅ loopManager.js: Loaded ${loopData.length} loop segments`);

        renderLoopButtons(songName);
      } catch (error) {
        console.error("❌ loopManager.js: Error loading loop file:", error);
        loopButtonsContainer.innerHTML = "<div style='color: red;'>[No loop segments found]</div>";
      }
    });

    function renderLoopButtons(songName) {
      loopButtonsContainer.innerHTML = "";

      loopData.forEach((segment, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Segment ${index + 1}`;
        btn.className = "loop-segment-btn";
        btn.addEventListener("click", () => {
          console.log(`🎯 Clicked segment ${index + 1}`);
          playFromSegment(index);
        });
        loopButtonsContainer.appendChild(btn);
      });
    }

    function playFromSegment(startIndex) {
      if (!loadAudioRefs()) {
        console.error("❌ loopManager.js: Audio elements not ready.");
        return;
      }

      if (!loopData[startIndex]) {
        console.error(`❌ loopManager.js: Invalid segment index ${startIndex}`);
        return;
      }

      isPlayingSegment = true;
      currentLoopIndex = startIndex;

      const playNextSegment = () => {
        if (!isPlayingSegment || currentLoopIndex >= loopData.length) {
          console.log("⏹️ loopManager.js: Reached end of segments or stopped");
          isPlayingSegment = false;
          return;
        }

        const segment = loopData[currentLoopIndex];
        const { start, end } = segment;

        console.log(`▶️ Playing segment ${currentLoopIndex + 1}: ${start} → ${end}s`);

        vocalAudio.currentTime = start;
        accompAudio.currentTime = start;

        vocalAudio.play().catch(err => console.warn("⚠️ vocal play error:", err));
        accompAudio.play().catch(err => console.warn("⚠️ accomp play error:", err));

        const checkEnd = setInterval(() => {
          const t = Math.max(vocalAudio.currentTime, accompAudio.currentTime);
          if (t >= end || !isPlayingSegment) {
            vocalAudio.pause();
            accompAudio.pause();
            clearInterval(checkEnd);
            currentLoopIndex++;
            if (isPlayingSegment) playNextSegment();
          }
        }, 200);
      };

      playNextSegment();
    }
  }, 100);
});
