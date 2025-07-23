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

let vocalAudio = new Audio();
let accompAudio = new Audio();

// 🟢🟢 [ LOOP VARIABLES ADDED ] 🟢🟢
let loopSegments = [];
let currentLoopIndex = 0;
let loopMode = true;
// 🟢🟢 [ END LOOP VARIABLES ] 🟢🟢

document.getElementById('vocalVolume').addEventListener('input', e => {
  vocalAudio.volume = parseFloat(e.target.value);
});
document.getElementById('accompVolume').addEventListener('input', e => {
  accompAudio.volume = parseFloat(e.target.value);
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(type === 'vocal' ? 'vocalVolume' : 'accompVolume');
  let vol = parseFloat(slider.value) + delta;
  vol = Math.min(1, Math.max(0, vol));
  slider.value = vol;
  if (type === 'vocal') vocalAudio.volume = vol;
  else accompAudio.volume = vol;
}

async function getTemporaryLink(path) {
  console.log("Trying to fetch from Dropbox path:", path);
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

function supportsFlac() {
  const a = document.createElement('audio');
  return !!a.canPlayType && a.canPlayType('audio/flac; codecs="flac"') !== "";
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

    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;

    vocalAudio.load();
    accompAudio.load();

    fetch(`lyrics/${prefix}.txt`)
      .then(res => res.ok ? res.text() : "Lyrics not found.")
      .then(txt => {
        const box = document.getElementById("lyricsBox");
        box.value = "";
        box.value = txt;
        box.scrollTop = 0;
      })
      .catch(err => {
        document.getElementById("lyricsBox").value = "Lyrics could not be loaded.";
        console.error("Lyrics load error:", err);
      });

    // 🟢🟢 [ LOAD LOOPS ] 🟢🟢
    try {
      const loopRes = await fetch(`lyrics/${prefix}_loops.json`);
      loopSegments = (await loopRes.json()) || [];
      currentLoopIndex = 0;
      document.getElementById("loopStatus").textContent = `🔁 Loaded ${loopSegments.length} loops`;
    } catch {
      loopSegments = [];
      document.getElementById("loopStatus").textContent = "";
    }
    // 🟢🟢 [ END LOAD LOOPS ] 🟢🟢

  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => {
  loadSong(e.target.value);
});

document.getElementById("playBtn").addEventListener("click", () => {
  if (loopMode && loopSegments.length > 0) {
    playNextLoop();
  } else {
    vocalAudio.currentTime = 0;
    accompAudio.currentTime = 0;
    Promise.all([vocalAudio.play(), accompAudio.play()])
      .catch(err => console.error("Playback error:", err));
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

document.getElementById("playFullBtn").addEventListener("click", () => {
  loopMode = false;
  document.getElementById("loopStatus").textContent = "🎵 Playing full song";
  vocalAudio.currentTime = 0;
  accompAudio.currentTime = 0;
  Promise.all([vocalAudio.play(), accompAudio.play()])
    .catch(err => console.error("Playback error:", err));
});

// 🟢🟢 [ PLAY LOOP FUNCTION ] 🟢🟢
function playNextLoop() {
  if (currentLoopIndex >= loopSegments.length) currentLoopIndex = 0;
  const loop = loopSegments[currentLoopIndex];
  const start = loop.start;
  const end = loop.end;

  vocalAudio.currentTime = start;
  accompAudio.currentTime = start;

  document.getElementById("loopStatus").textContent = `🔁 Playing Loop ${currentLoopIndex + 1} of ${loopSegments.length}`;

  Promise.all([vocalAudio.play(), accompAudio.play()]).catch(err => console.error(err));

  const duration = (end - start) * 1000;
  setTimeout(() => {
    vocalAudio.pause();
    accompAudio.pause();
    currentLoopIndex++;
    playNextLoop();
  }, duration);
}
// 🟢🟢 [ END PLAY LOOP FUNCTION ] 🟢🟢

loadSongs();
