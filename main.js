// === Configuration ===
let ACCESS_TOKEN = "";

async function loadDropboxToken() {
  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
  } catch (err) {
    console.error("Failed to fetch Dropbox token:", err);
  }
}

const DROPBOX_FOLDER = "/WorshipSongs/";
let vocalAudio = new Audio();
let accompAudio = new Audio();

["vocal", "accomp"].forEach(type => {
  document.getElementById(`${type}Volume`).addEventListener("input", e => {
    (type === "vocal" ? vocalAudio : accompAudio).volume = parseFloat(e.target.value);
  });
});

function adjustVolume(type, delta) {
  const slider = document.getElementById(`${type}Volume`);
  let vol = Math.min(1, Math.max(0, parseFloat(slider.value) + delta));
  slider.value = vol;
  (type === "vocal" ? vocalAudio : accompAudio).volume = vol;
}

function skipSeconds(delta) {
  const newTime = Math.max(0, vocalAudio.currentTime + delta);
  vocalAudio.currentTime = newTime;
  accompAudio.currentTime = newTime;
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") skipSeconds(-1);
  if (e.key === "ArrowRight") skipSeconds(1);
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

let loops = [];
let activeLoopIndex = 0;
const loopCanvas = document.getElementById("loopCanvas");
const ctx = loopCanvas.getContext("2d");
let currentPrefix = "";

function drawLoops(duration) {
  ctx.clearRect(0, 0, loopCanvas.width, loopCanvas.height);
  if (!loops.length || !duration) return;
  const width = loopCanvas.width;
  const height = loopCanvas.height;
  const pxPerSec = width / duration;
  loops.forEach((loop, i) => {
    const xStart = loop.start * pxPerSec;
    const xEnd = loop.end * pxPerSec;
    ctx.fillStyle = "#e0b0ff";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.fillStyle = "#333";
    ctx.fillText(i + 1, xStart + 3, 15);
  });
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(vocalAudio.currentTime * pxPerSec, 0);
  ctx.lineTo(vocalAudio.currentTime * pxPerSec, height);
  ctx.stroke();
}

loopCanvas.addEventListener("click", e => {
  if (!vocalAudio.duration || !loops.length) return;
  const rect = loopCanvas.getBoundingClientRect();
  const seconds = (e.clientX - rect.left) * vocalAudio.duration / loopCanvas.width;
  const clickedIndex = loops.findIndex(loop => seconds >= loop.start && seconds <= loop.end);
  if (clickedIndex >= 0) {
    activeLoopIndex = clickedIndex;
    vocalAudio.currentTime = loops[activeLoopIndex].start;
    accompAudio.currentTime = loops[activeLoopIndex].start;
    vocalAudio.play();
    accompAudio.play();
  }
});

// === Segment Visualization Setup ===
const segmentCanvas = document.createElement("canvas");
segmentCanvas.id = "segmentCanvas";
segmentCanvas.style.position = "fixed";
segmentCanvas.style.bottom = "0";
segmentCanvas.style.left = "0";
segmentCanvas.style.width = "100%";
segmentCanvas.style.height = "40px";
segmentCanvas.style.zIndex = "9999";
segmentCanvas.style.background = "#fff";
document.body.appendChild(segmentCanvas);

const segmentCtx = segmentCanvas.getContext("2d");
let segments = [];
let activeSegmentIndex = -1;

function drawSegments(duration, currentTime) {
  const width = segmentCanvas.width = segmentCanvas.offsetWidth;
  const height = segmentCanvas.height = segmentCanvas.offsetHeight;
  segmentCtx.clearRect(0, 0, width, height);

  if (!segments.length || !duration) return;
  const pxPerSec = width / duration;

  segments.forEach((seg, i) => {
    const xStart = seg.start * pxPerSec;
    const xEnd = seg.end * pxPerSec;
    segmentCtx.fillStyle = "#a8e6cf";
    segmentCtx.fillRect(xStart, 0, xEnd - xStart, height);
    segmentCtx.fillStyle = "#000";
    segmentCtx.font = "14px sans-serif";
    segmentCtx.fillText(i + 1, xStart + 5, 25);
  });

  const markerX = currentTime * pxPerSec;
  segmentCtx.strokeStyle = "#f00";
  segmentCtx.beginPath();
  segmentCtx.moveTo(markerX, 0);
  segmentCtx.lineTo(markerX, height);
  segmentCtx.stroke();
}

segmentCanvas.addEventListener("click", (e) => {
  if (!vocalAudio.duration || !segments.length) return;
  const rect = segmentCanvas.getBoundingClientRect();
  const seconds = (e.clientX - rect.left) * vocalAudio.duration / segmentCanvas.width;
  const clickedIndex = segments.findIndex(seg => seconds >= seg.start && seconds <= seg.end);
  if (clickedIndex >= 0) {
    activeSegmentIndex = clickedIndex;
    vocalAudio.currentTime = segments[clickedIndex].start;
    accompAudio.currentTime = segments[clickedIndex].start;
    vocalAudio.play();
    accompAudio.play();
  }
});

vocalAudio.addEventListener("timeupdate", () => {
  drawLoops(vocalAudio.duration);
  drawSegments(vocalAudio.duration, vocalAudio.currentTime);

  if (activeSegmentIndex >= 0 && segments.length) {
    const seg = segments[activeSegmentIndex];
    if (vocalAudio.currentTime >= seg.end) {
      activeSegmentIndex++;
      if (activeSegmentIndex < segments.length) {
        vocalAudio.currentTime = segments[activeSegmentIndex].start;
        accompAudio.currentTime = segments[activeSegmentIndex].start;
      } else {
        vocalAudio.pause();
        accompAudio.pause();
        activeSegmentIndex = -1;
      }
    }
  }
});

async function loadSong(name) {
  const prefix = name.trim();
  currentPrefix = prefix;
  const ext = "mp3";
  try {
    const [vocalURL, accompURL] = await Promise.all([
      getTemporaryLink(`${DROPBOX_FOLDER}${prefix}_vocal.${ext}`),
      getTemporaryLink(`${DROPBOX_FOLDER}${prefix}_acc.${ext}`)
    ]);
    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;
    vocalAudio.load();
    accompAudio.load();
    document.getElementById("lyricsBox").value = "Loading...";
    const lyrics = await fetch(`lyrics/${prefix}.txt`).then(r => r.ok ? r.text() : "Lyrics not found");
    document.getElementById("lyricsBox").value = lyrics;
    try {
      const segData = await fetch(`lyrics/${prefix}_loops.json`).then(r => r.json());
      segments = segData;
      activeSegmentIndex = -1;
    } catch {
      segments = [];
      activeSegmentIndex = -1;
    }
    updateBookmarkStar();
  } catch (err) {
    alert("Error loading song: " + err.message);
  }
}

// The rest of the original unchanged script continues below...
// [Omitted here for brevity – your complete unchanged logic remains intact]
