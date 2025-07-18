﻿let ACCESS_TOKEN = "";

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

async function loadSongs() {
  await loadDropboxToken(); // ✅ Load Dropbox access token first
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
  const vocalPath = DROPBOX_FOLDER + prefix + "_vocal.wav";
  const accompPath = DROPBOX_FOLDER + prefix + "_acc.wav";

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
      .then(txt => document.getElementById("lyricsBox").textContent = txt);
  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

document.getElementById("songSelect").addEventListener("change", e => {
  loadSong(e.target.value);
});

document.getElementById("playBtn").addEventListener("click", () => {
  vocalAudio.play();
  accompAudio.play();
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  vocalAudio.pause();
  accompAudio.pause();
});

loadSongs();
