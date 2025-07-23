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

// 🟢🟢 [ LOOP VARIABLES ] 🟢🟢
let loopData = [];
let currentLoopIndex = 0;
let isLoopMode = true;
let currentSongName = "";
let startTime = null;
let endTime = null;
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
  currentSongName = name;
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

    fetch(`https://content.dropboxapi.com/2/files/download`, {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        'Dropbox-API-Arg': JSON.stringify({ path: `${DROPBOX_FOLDER}${prefix}_loops.json` })
      }
    })
    .then(res => res.ok ? res.text() : Promise.resolve("[]"))
    .then(json => {
      loopData = JSON.parse(json);
      currentLoopIndex = 0;
      document.getElementById("loopStatus").innerText = loopData.length ? `🔁 Looping ${loopData.length} segment(s)` : "🔁 No loops defined for this song.";
    })
    .catch(err => {
      loopData = [];
      document.getElementById("loopStatus").innerText = "🔁 No loops available.";
    });

  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => loadSong(e.target.value));

document.getElementById("playBtn").addEventListener("click", () => {
  if (loopData.length) playLoop();
  else Promise.all([vocalAudio.play(), accompAudio.play()]).catch(err => console.error("Playback error:", err));
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

document.getElementById("playFullBtn").addEventListener("click", () => {
  isLoopMode = false;
  vocalAudio.currentTime = 0;
  accompAudio.currentTime = 0;
  Promise.all([vocalAudio.play(), accompAudio.play()]).catch(err => console.error("Playback error:", err));
});

function playLoop() {
  if (!loopData.length) return;
  isLoopMode = true;
  const loop = loopData[currentLoopIndex];
  vocalAudio.currentTime = loop.start;
  accompAudio.currentTime = loop.start;
  vocalAudio.play();
  accompAudio.play();

  const interval = setInterval(() => {
    if (vocalAudio.currentTime >= loop.end || accompAudio.currentTime >= loop.end) {
      vocalAudio.pause();
      accompAudio.pause();
      clearInterval(interval);
      currentLoopIndex = (currentLoopIndex + 1) % loopData.length;
      playLoop();
    }
  }, 200);
}

document.getElementById("markStart").addEventListener("click", () => {
  startTime = Math.min(vocalAudio.currentTime, accompAudio.currentTime);
});

document.getElementById("markEnd").addEventListener("click", () => {
  endTime = Math.max(vocalAudio.currentTime, accompAudio.currentTime);
  if (startTime != null && endTime > startTime) {
    loopData.push({ start: startTime, end: endTime });
    const li = document.createElement("li");
    li.textContent = `Loop ${loopData.length}: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`;
    document.getElementById("loopList").appendChild(li);
    startTime = null;
    endTime = null;
  }
});

document.getElementById("saveLoops").addEventListener("click", async () => {
  const code = document.getElementById("ownerCode").value;
  const response = await fetch("/.netlify/functions/saveLoops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, song: currentSongName, loops: loopData })
  });

  if (response.ok) {
    document.getElementById("saveStatus").textContent = `✅ Loops saved for ${currentSongName}`;
  } else {
    const msg = await response.text();
    document.getElementById("saveStatus").textContent = `❌ Failed: ${msg}`;
  }
});

loadSongs();
