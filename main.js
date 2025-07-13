let vocalAudio = document.getElementById("vocalAudio");
let accAudio = document.getElementById("accAudio");
let songSelect = document.getElementById("songSelect");
let lyricsBox = document.getElementById("lyricsBox");
let markInfo = document.getElementById("markInfo");

let startTime = 0;
let endTime = 0;
let loopData = {};

const dbx = new Dropbox.Dropbox({ accessToken: DROPBOX_TOKEN });

async function listSongsFromLocalLyrics() {
  const res = await fetch("./lyrics/");
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const links = Array.from(doc.querySelectorAll("a"));

  const songs = links
    .map(link => decodeURIComponent(link.getAttribute("href")))
    .filter(href => href.endsWith(".txt"))
    .map(href => href.replace(/^.*[\\/]/, "").replace(".txt", "").trim());

  songSelect.innerHTML = songs.map(name => `<option>${name}</option>`).join("");
  if (songs.length > 0) loadSong(songs[0]);
}

songSelect.addEventListener("change", () => {
  const name = songSelect.value;
  if (name) loadSong(name);
});

function sanitizeFilename(name) {
  return name.trim().replace(/\s+/g, "_");
}

async function loadSong(songName) {
  const prefix = sanitizeFilename(songName);

  // Load lyrics
  try {
    const res = await fetch(`lyrics/${songName}.txt`);
    lyricsBox.value = await res.text();
  } catch (e) {
    lyricsBox.value = "Lyrics not found.";
  }

  // Load audio files
  const vocalUrl = await getDropboxLink(`${prefix}_vocal.wav`);
  const accUrl = await getDropboxLink(`${prefix}_accompaniment.wav`);

  vocalAudio.src = vocalUrl;
  accAudio.src = accUrl;

  // Load loops
  try {
    const loopUrl = await getDropboxLink(`${prefix}_loops.json`);
    const loopRes = await fetch(loopUrl);
    loopData = await loopRes.json();
  } catch (e) {
    loopData = {};
  }

  startTime = 0;
  endTime = 0;
  markInfo.innerText = `Start marked at 0.00s`;
}

function play() {
  vocalAudio.play();
  accAudio.play();
}

function pause() {
  vocalAudio.pause();
  accAudio.pause();
}

function seek(seconds) {
  vocalAudio.currentTime += seconds;
  accAudio.currentTime += seconds;
}

function adjustVolume(track, delta) {
  const audio = track === "vocal" ? vocalAudio : accAudio;
  const slider = document.getElementById(track === "vocal" ? "vocalSlider" : "accSlider");
  audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
  slider.value = audio.volume;
}

function syncSlider(track) {
  const slider = document.getElementById(track === "vocal" ? "vocalSlider" : "accSlider");
  const audio = track === "vocal" ? vocalAudio : accAudio;
  audio.volume = parseFloat(slider.value);
}

function markStart() {
  startTime = vocalAudio.currentTime;
  markInfo.innerText = `Start marked at ${startTime.toFixed(2)}s`;
}

function markEnd() {
  endTime = vocalAudio.currentTime;
}

function adjustMark(delta) {
  startTime = Math.max(0, startTime + delta);
  markInfo.innerText = `Start marked at ${startTime.toFixed(2)}s`;
}

function downloadLoop() {
  const song = songSelect.value;
  const loop = {
    song,
    start: startTime,
    end: endTime,
  };
  const blob = new Blob([JSON.stringify(loop, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${sanitizeFilename(song)}_loops.json`;
  a.click();
}

async function getDropboxLink(filename) {
  const path = `/public/${filename}`;
  try {
    const res = await dbx.filesGetTemporaryLink({ path });
    return res.result.link;
  } catch (err) {
    console.error("Dropbox fetch error:", err);
    return "";
  }
}

// Load songs on page load
window.onload = () => {
  listSongsFromLocalLyrics();
};
