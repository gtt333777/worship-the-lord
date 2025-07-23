const ACCESS_TOKEN = "YOUR_DROPBOX_ACCESS_TOKEN_HERE"; // Replace if needed
const DROPBOX_FOLDER = "/WorshipSongs/";
let currentSongName = "";
let vocalAudio = new Audio();
let accompAudio = new Audio();
let loopList = [];
let loopStart = null;
let loopEnd = null;
let loopIndex = 0;
let isLooping = true;

async function fetchTextFile(path) {
  const response = await fetch(path);
  return response.ok ? response.text() : "";
}

async function loadSongList() {
  const response = await fetch("lyrics/songs_names.txt");
  const names = (await response.text()).trim().split("\n");
  const select = document.getElementById("songSelect");
  names.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
  loadSong(); // Load first song
}

async function loadSong() {
  loopList = [];
  loopIndex = 0;
  isLooping = true;
  document.getElementById("loopInfo").textContent = "🔁 No loops available.";
  document.getElementById("loopList").innerHTML = "";
  const name = document.getElementById("songSelect").value;
  currentSongName = name;

  const prefix = encodeURIComponent(name);
  const lyrics = await fetchTextFile(`lyrics/${prefix}.txt`);
  document.getElementById("lyrics").value = lyrics;

  const accUrl = `https://content.dropboxapi.com/2/files/download`;
  const accHeaders = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Dropbox-API-Arg": JSON.stringify({ path: `${DROPBOX_FOLDER}${name}_acc.wav` }),
  };
  const vocalHeaders = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Dropbox-API-Arg": JSON.stringify({ path: `${DROPBOX_FOLDER}${name}_vocal.wav` }),
  };

  vocalAudio = new Audio();
  accompAudio = new Audio();

  vocalAudio.src = URL.createObjectURL(await (await fetch(accUrl, { headers: vocalHeaders })).blob());
  accompAudio.src = URL.createObjectURL(await (await fetch(accUrl, { headers: accHeaders })).blob());

  vocalAudio.addEventListener("ended", handleEnded);
  accompAudio.addEventListener("ended", handleEnded);

  try {
    const res = await fetch(`https://content.dropboxapi.com/2/files/download`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({ path: `${DROPBOX_FOLDER}${name}_loops.json` }),
      },
    });
    if (res.ok) {
      loopList = await res.json();
      updateLoopUI();
    }
  } catch (e) {}
}

function play() {
  syncTime();
  vocalAudio.play();
  accompAudio.play();
}

function pause() {
  vocalAudio.pause();
  accompAudio.pause();
}

function syncTime() {
  accompAudio.currentTime = vocalAudio.currentTime;
}

function handleEnded() {
  if (isLooping && loopList.length > 0) {
    loopIndex = (loopIndex + 1) % loopList.length;
    const loop = loopList[loopIndex];
    vocalAudio.currentTime = loop.start;
    accompAudio.currentTime = loop.start;
    play();
  }
}

function playFullSong() {
  isLooping = false;
  loopIndex = 0;
  vocalAudio.currentTime = 0;
  accompAudio.currentTime = 0;
  play();
}

function adjustVolume(type, delta) {
  const audio = type === "vocal" ? vocalAudio : accompAudio;
  const slider = document.getElementById(type + "Volume");
  let newVal = Math.max(0, Math.min(1, parseFloat(slider.value) + delta));
  audio.volume = newVal;
  slider.value = newVal;
}

function markStart() {
  loopStart = vocalAudio.currentTime.toFixed(1);
  alert("Marked start: " + loopStart + "s");
}

function markEnd() {
  if (loopStart === null) {
    alert("Mark start first!");
    return;
  }
  loopEnd = vocalAudio.currentTime.toFixed(1);
  loopList.push({ start: parseFloat(loopStart), end: parseFloat(loopEnd) });
  updateLoopUI();
  loopStart = null;
  loopEnd = null;
}

function updateLoopUI() {
  const list = document.getElementById("loopList");
  list.innerHTML = "";
  loopList.forEach((loop, i) => {
    const li = document.createElement("li");
    li.textContent = `● Loop ${i + 1}: ${loop.start}s - ${loop.end}s`;
    list.appendChild(li);
  });
  document.getElementById("loopInfo").textContent = `🔁 ${loopList.length} loop(s) available.`;
}

function downloadLoops() {
  const code = document.getElementById("ownerCodeInput").value.trim();
  if (code !== "jesus_owns") {
    alert("Incorrect owner code.");
    return;
  }

  if (!currentSongName || loopList.length === 0) {
    alert("Please select a song and create at least one loop.");
    return;
  }

  const blob = new Blob([JSON.stringify(loopList, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentSongName}_loops.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`Downloaded: ${currentSongName}_loops.json\nPlease upload it manually to Dropbox.`);
}

window.onload = loadSongList;
