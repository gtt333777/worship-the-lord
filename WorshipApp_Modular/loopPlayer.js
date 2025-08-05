console.log("loopPlayer.js: Starting...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("loopPlayer.js: DOMContentLoaded – using hardcoded song name for test");

  // STEP 1: HARDCODED TAMIL SONG NAME
  const testTamilName = "என் வாழ்க்கையெல்லாம் உம்";
  const loopJsonPath = `lyrics/${testTamilName}_loops.json`;

  console.log("📄 Trying to fetch loop file:", loopJsonPath);

  fetch(loopJsonPath)
    .then(response => {
      if (!response.ok) throw new Error("Loop JSON not found");
      return response.json();
    })
    .then(loopData => {
      console.log("✅ Loop data loaded:", loopData);

      const loopButtonsContainer = document.getElementById("loopButtonsContainer");
      if (!loopButtonsContainer) {
        console.error("❌ loopButtonsContainer not found in DOM");
        return;
      }

      // Clear any previous buttons
      loopButtonsContainer.innerHTML = "";

      loopData.forEach((segment, index) => {
        const button = document.createElement("button");
        button.textContent = `Segment ${index + 1}`;
        button.addEventListener("click", () => {
          const start = segment.start;
          const end = segment.end;

          console.log(`▶️ Playing Segment ${index + 1}: ${start}s to ${end}s`);

          window.vocalAudio.currentTime = start;
          window.accompAudio.currentTime = start;

          window.vocalAudio.play();
          window.accompAudio.play();

          const duration = end - start;

          setTimeout(() => {
            window.vocalAudio.pause();
            window.accompAudio.pause();
            console.log(`⏸️ Segment ${index + 1} ended after ${duration}s`);
          }, duration * 1000);
        });

        loopButtonsContainer.appendChild(button);
      });
    })
    .catch(err => {
      console.warn("⚠️ Loop file not found or error reading:", err.message);
    });
});
