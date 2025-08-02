// 🔁 loopManager.js – Full Final Version

let loopSegments = [];
let currentLoopIndex = -1;
let loopTimeout = null;

// Called after a song is selected, use prefix without _vocal/_acc
function loadLoopData(prefix) {
  const jsonUrl = getDropboxUrl(`${prefix}_loops.json`);

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      loopSegments = data;
      renderLoopButtons();
      console.log(`✅ Loaded ${data.length} loop segments`);
    })
    .catch(err => {
      console.warn("⚠️ No loop data found:", err);
      loopSegments = [];
      renderLoopButtons(); // Clear old buttons if any
    });
}

function renderLoopButtons() {
  const container = document.getElementById("loopButtonsContainer");
  if (!container) {
    console.warn("⚠️ loopButtonsContainer not found");
    return;
  }

  container.innerHTML = ""; // Clear old

  loopSegments.forEach((seg, i) => {
    const btn = document.createElement("button");
    btn.innerText = `Segment ${i + 1}`;
    btn.className = "loop-button";
    btn.onclick = () => playSegment(i);
    container.appendChild(btn);
  });
}

function playSegment(index) {
  if (!loopSegments[index]) return;

  // Stop previous playback
  stopPlayback();

  const loop = loopSegments[index];
  currentLoopIndex = index;

  console.log(`🎵 Playing segment ${index + 1}: ${loop.start}s to ${loop.end}s`);

  vocalAudio.currentTime = loop.start;
  accompAudio.currentTime = loop.start;
  vocalAudio.play();
  accompAudio.play();

  const duration = loop.end - loop.start;

  loopTimeout = setTimeout(() => {
    vocalAudio.pause();
    accompAudio.pause();
    console.log(`🛑 Segment ${index + 1} ended`);
  }, duration * 1000);
}

function stopPlayback() {
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  vocalAudio.pause();
  accompAudio.pause();
}
