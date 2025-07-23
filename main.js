let ACCESS_TOKEN = "";

// ✅ Securely load Dropbox access token from Netlify serverless function
async function loadDropboxToken() {
  try {
    const res = await fetch('/.netlify/functions/getDropboxToken');
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
  } catch (err) {
    console.error("Failed to fetch Dropbox token:", err);
  }
}

const DROPBOX_FOLDER = "/WorshipSongs/";

let audioCtx;
let vocalBuffer, accompBuffer;
let vocalSource, accompSource;
let gainNodeVocal, gainNodeAccomp;

// === ✅ [ OLD Audio elements REMOVED ] ===
// let vocalAudio = new Audio();
// let accompAudio = new Audio();
// === ✅ [ END REMOVED ] ===

function supportsFlac() {
  const a = document.createElement('audio');
  return !!a.canPlayType && a.canPlayType('audio/flac; codecs="flac"') !== "";
}

function adjustVolume(type, delta) {
  const slider = document.getElementById(type === 'vocal' ? 'vocalVolume' : 'accompVolume');
  let vol = parseFloat(slider.value) + delta;
  vol = Math.min(1, Math.max(0, vol));
  slider.value = vol;

  // ✅ Apply gain to AudioContext
  if (type === 'vocal' && gainNodeVocal) gainNodeVocal.gain.value = vol;
  if (type === 'accompaniment' && gainNodeAccomp) gainNodeAccomp.gain.value = vol;
}

document.getElementById('vocalVolume').addEventListener('input', e => {
  if (gainNodeVocal) gainNodeVocal.gain.value = parseFloat(e.target.value);
});
document.getElementById('accompVolume').addEventListener('input', e => {
  if (gainNodeAccomp) gainNodeAccomp.gain.value = parseFloat(e.target.value);
});

async function getTemporaryLink(path) {
  const response = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path })
  });
  if (!response.ok) throw new Error("Failed to get Dropbox link");
  const data = await response.json();
  return data.link;
}

async function fetchAndDecodeAudio(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

async function playSyncedAudio(vocalURL, accompURL) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Stop previous sources if playing
  if (vocalSource) vocalSource.stop();
  if (accompSource) accompSource.stop();

  // Decode
  [vocalBuffer, accompBuffer] = await Promise.all([
    fetchAndDecodeAudio(vocalURL),
    fetchAndDecodeAudio(accompURL)
  ]);

  // Create sources
  vocalSource = audioCtx.createBufferSource();
  accompSource = audioCtx.createBufferSource();
  vocalSource.buffer = vocalBuffer;
  accompSource.buffer = accompBuffer;

  // Create gain nodes
  gainNodeVocal = audioCtx.createGain();
  gainNodeAccomp = audioCtx.createGain();

  gainNodeVocal.gain.value = parseFloat(document.getElementById('vocalVolume').value);
  gainNodeAccomp.gain.value = parseFloat(document.getElementById('accompVolume').value);

  // Connect to context
  vocalSource.connect(gainNodeVocal).connect(audioCtx.destination);
  accompSource.connect(gainNodeAccomp).connect(audioCtx.destination);

  const startTime = audioCtx.currentTime + 0.1;
  vocalSource.start(startTime);
  accompSource.start(startTime);
}

async function loadSongs() {
  await loadDropboxToken();
  const response = await fetch("lyrics/song_names.txt");
  const songNames = (await response.text()).split('\n').map(s => s.trim()).filter(Boolean);
  const select = document.getElementById("songSelect");
  songNames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  loadSong(songNames[0]);
}

async function loadSong(name) {
  const prefix = name.trim();
  const ext = supportsFlac() ? "flac" : "mp3";
  const vocalPath = `${DROPBOX_FOLDER}${prefix}_vocal.${ext}`;
  const accompPath = `${DROPBOX_FOLDER}${prefix}_acc.${ext}`;

  try {
    const [vocalURL, accompURL] = await Promise.all([
      getTemporaryLink(vocalPath),
      getTemporaryLink(accompPath)
    ]);

    // === ✅ NEW: preload buffers for synchronized playback ===
    vocalBuffer = null;
    accompBuffer = null;
    await Promise.all([
      fetchAndDecodeAudio(vocalURL).then(b => vocalBuffer = b),
      fetchAndDecodeAudio(accompURL).then(b => accompBuffer = b)
    ]);

    // === ✅ FIXED: load lyrics ===
    fetch(`lyrics/${prefix}.txt`)
      .then(res => res.ok ? res.text() : "Lyrics not found.")
      .then(txt => {
        const box = document.getElementById("lyricsBox");
        box.value = "";
        box.value = txt;
        box.scrollTop = 0;
      });
  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => {
  loadSong(e.target.value);
});

document.getElementById("playBtn").addEventListener("click", async () => {
  if (vocalBuffer && accompBuffer) {
    // === ✅ PLAY using AudioContext ===
    vocalSource = audioCtx.createBufferSource();
    accompSource = audioCtx.createBufferSource();

    vocalSource.buffer = vocalBuffer;
    accompSource.buffer = accompBuffer;

    gainNodeVocal = audioCtx.createGain();
    gainNodeAccomp = audioCtx.createGain();

    gainNodeVocal.gain.value = parseFloat(document.getElementById('vocalVolume').value);
    gainNodeAccomp.gain.value = parseFloat(document.getElementById('accompVolume').value);

    vocalSource.connect(gainNodeVocal).connect(audioCtx.destination);
    accompSource.connect(gainNodeAccomp).connect(audioCtx.destination);

    const startTime = audioCtx.currentTime + 0.1;
    vocalSource.start(startTime);
    accompSource.start(startTime);
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  if (vocalSource) vocalSource.stop();
  if (accompSource) accompSource.stop();
});

loadSongs();
