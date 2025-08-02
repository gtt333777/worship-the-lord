// ✅ loopManager.js — FULL WORKING VERSION (with suffix handling and foolproof load timing)

let currentLoops = [];
let currentLoopIndex = 0;
let loopData = {};
let isLooping = false;
let loopTimeout;
let activeButton = null;

function fetchLoopData(suffix) {
  const dropboxBase = 'https://www.dropbox.com/scl/fi/';
  const token = 'YOUR_DROPBOX_ACCESS_TOKEN'; // ⚠️ Replace with secure method if using refresh tokens
  const filePath = `${suffix}_loops.json`;
  const fullUrl = `/WorshipSongs/${filePath}?dl=1`;

  console.log('🎧 Fetching loop data for:', filePath);

  return fetch(fullUrl)
    .then(res => res.ok ? res.json() : Promise.reject('❌ Loop file not found'))
    .then(data => {
      loopData[suffix] = data;
      return data;
    });
}

function renderLoopButtons(loops) {
  const container = document.getElementById('loopButtonsContainer');
  if (!container) {
    console.warn('⚠️ loopButtonsContainer not found during renderLoopButtons.');
    return;
  }

  container.innerHTML = ''; // Clear previous

  loops.forEach((loop, index) => {
    const btn = document.createElement('button');
    btn.textContent = `Segment ${index + 1}`;
    btn.style.margin = '2px';
    btn.dataset.index = index;

    btn.addEventListener('click', () => {
      highlightButton(btn);
      playLoopFromIndex(index);
    });

    container.appendChild(btn);
  });
}

function highlightButton(button) {
  if (activeButton) activeButton.style.backgroundColor = '';
  button.style.backgroundColor = '#ffd966';
  activeButton = button;
}

function removeButtonHighlight() {
  if (activeButton) {
    activeButton.style.backgroundColor = '';
    activeButton = null;
  }
}

function playLoopFromIndex(index) {
  if (!currentLoops.length) return;

  const loop = currentLoops[index];
  currentLoopIndex = index;
  isLooping = true;

  const startTime = loop.start;
  const endTime = loop.end;

  vocalAudio.currentTime = startTime;
  accompAudio.currentTime = startTime;

  vocalAudio.play();
  accompAudio.play();

  clearTimeout(loopTimeout);
  loopTimeout = setInterval(() => {
    const now = vocalAudio.currentTime;
    if (now >= endTime) {
      clearTimeout(loopTimeout);
      if (currentLoopIndex + 1 < currentLoops.length) {
        currentLoopIndex++;
        playLoopFromIndex(currentLoopIndex);
      } else {
        vocalAudio.pause();
        accompAudio.pause();
        isLooping = false;
        removeButtonHighlight();
      }
    }
  }, 200);
}

function handleSongSelection(songName) {
  const suffix = songName;
  console.log('🎵 Selected song:', suffix);

  fetchLoopData(suffix)
    .then(loops => {
      currentLoops = loops;
      renderLoopButtons(loops);

      if (loops.length) {
        playLoopFromIndex(0); // Always start from first loop
      }
    })
    .catch(err => {
      console.warn('⚠️ Could not load loop data:', err);
      currentLoops = [];
      const container = document.getElementById('loopButtonsContainer');
      if (container) container.innerHTML = '';
    });
}

// ✅ Hook AFTER loopManager.html is injected
document.addEventListener("htmlLoaded:loopManager.html", () => {
  console.log('✅ loopManager.html loaded — initializing loopManager...');
  const songSelect = document.querySelector("select");
  if (songSelect) {
    songSelect.addEventListener("change", () => {
      const selected = songSelect.value;
      if (selected) handleSongSelection(selected);
    });
  }

  // If a song is already selected
  const selected = songSelect?.value;
  if (selected) handleSongSelection(selected);
});
