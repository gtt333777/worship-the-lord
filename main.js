const DROPBOX_TOKEN = config.k1;
console.log("Loaded Dropbox token:", DROPBOX_TOKEN);
// Your logic can continue here...
let vocalAudio = document.getElementById('vocalAudio');
let accAudio = document.getElementById('accAudio');
let lyricsBox = document.getElementById('lyrics');
let loopBar = document.getElementById('loopBar');
let songSelect = document.getElementById('songSelect');

let currentSong = '';
let loops = [];
let startMark = 0;
let endMark = 0;
let isPrelude = false;  // stores prelude status for current loop

window.onload = async () => {
  try {
    const res = await fetch('lyrics/');
    const text = await res.text();
    const matches = [...text.matchAll(/href="([^"]+\.txt)"/g)];
    const names = matches.map(m => decodeURIComponent(m[1].replace('.txt', '')));
    songSelect.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
    if (names.length) {
      currentSong = names[0];
      loadSelectedSong();
    }
  } catch (e) {
    console.error('Error loading lyrics folder:', e);
  }
};

function loadSelectedSong() {
  currentSong = songSelect.value;

  fetch(`lyrics/${currentSong}.txt`)
    .then(res => res.text())
    .then(data => lyricsBox.value = data);

  fetch(`lyrics/${currentSong}_loops.json`)
    .then(res => res.ok ? res.json() : [])
    .then(data => {
      loops = data;
      drawLoops();
    });

  vocalAudio.src = `lyrics/${currentSong}_vocal.wav`;
  accAudio.src = `lyrics/${currentSong}_accompaniment.wav`;
}

function play() {
  vocalAudio.play();
  accAudio.play();
}
function pause() {
  vocalAudio.pause();
  accAudio.pause();
}
function seek(sec) {
  vocalAudio.currentTime += sec;
  accAudio.currentTime += sec;
}
function adjustVolume(type, delta) {
  const slider = type === 'vocal' ? vocalSlider : accSlider;
  slider.value = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
  setVolume(type);
}
function setVolume(type) {
  if (type === 'vocal') vocalAudio.volume = vocalSlider.value;
  else accAudio.volume = accSlider.value;
}
function markStart() {
  startMark = vocalAudio.currentTime;
  isPrelude = confirm('Does this loop contain a prelude?');
  document.getElementById('status').innerText = `Start marked at ${startMark.toFixed(2)}s`;
}
function markEnd() {
  endMark = vocalAudio.currentTime;
  loops.push({ start: startMark, end: endMark, prelude: isPrelude });
  drawLoops();
}
function adjustStart(sec) {
  startMark = Math.max(0, startMark + sec);
  document.getElementById('status').innerText = `Start marked at ${startMark.toFixed(2)}s`;
}
function downloadLoops() {
  const blob = new Blob([JSON.stringify(loops, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentSong}_loops.json`;
  a.click();
}

function drawLoops() {
  loopBar.innerHTML = '';
  const duration = vocalAudio.duration || 100;
  loops.forEach((loop, i) => {
    const div = document.createElement('div');
    const left = (loop.start / duration) * 100;
    const width = ((loop.end - loop.start) / duration) * 100;
    div.className = `loop-segment${loop.prelude ? ' prelude' : ''}`;
    div.style.left = `${left}%`;
    div.style.width = `${width}%`;
    loopBar.appendChild(div);
  });
}
