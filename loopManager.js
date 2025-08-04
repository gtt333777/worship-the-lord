// loopManager.js
console.log("🔁 loopManager.js: Starting");

document.addEventListener("DOMContentLoaded", async () => {
  const loopButtonsContainer = document.getElementById("loopButtonsContainer");
  const songSelect = document.getElementById("songSelect");

  if (!loopButtonsContainer || !songSelect) {
    console.warn("⚠️ loopManager.js: Waiting for #songSelect and #loopButtonsContainer...");
    return;
  }

  console.log("✅ loopManager.js: DOM elements found");

  let currentLoops = [];
  let currentSegmentIndex = 0;
  let vocalAudio, accompAudio;

  async function fetchDropboxAccessToken() {
    try {
      const response = await fetch("/.netlify/functions/getDropboxToken");
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("❌ Failed to fetch Dropbox token", error);
      return null;
    }
  }

  function getSongPrefix(songName) {
    const suffix = songName.trim();
    return suffix;
  }

  function createAudioElement(id) {
    const audio = new Audio();
    audio.id = id;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    return audio;
  }

  function loadAndPlaySegment(index) {
    if (!currentLoops.length) return;
    const loop = currentLoops[index];
    if (!loop) return;

    vocalAudio.currentTime = loop.start;
    accompAudio.currentTime = loop.start;
    vocalAudio.play();
    accompAudio.play();

    function stopAtEnd() {
      if (vocalAudio.currentTime >= loop.end || accompAudio.currentTime >= loop.end) {
        vocalAudio.pause();
        accompAudio.pause();
        vocalAudio.removeEventListener("timeupdate", stopAtEnd);
        accompAudio.removeEventListener("timeupdate", stopAtEnd);
      }
    }

    vocalAudio.addEventListener("timeupdate", stopAtEnd);
    accompAudio.addEventListener("timeupdate", stopAtEnd);
  }

  function createSegmentButtons() {
    loopButtonsContainer.innerHTML = "";
    currentLoops.forEach((loop, i) => {
      const btn = document.createElement("button");
      btn.textContent = `Segment ${i + 1}`;
      btn.style.marginRight = "5px";
      btn.onclick = () => {
        console.log(`▶️ User clicked Segment ${i + 1}`);
        currentSegmentIndex = i;
        loadAndPlaySegment(currentSegmentIndex);
      };
      loopButtonsContainer.appendChild(btn);
    });
  }

  async function loadLoopJson(songPrefix, token) {
    const loopsUrl = `https://content.dropboxapi.com/2/files/download`;
    const dropboxPath = `/WorshipSongs/${songPrefix}_loops.json`;

    const response = await fetch(loopsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: dropboxPath }),
      },
    });

    if (!response.ok) throw new Error("Failed to load loops JSON");

    const text = await response.text();
    return JSON.parse(text);
  }

  async function loadAudioFiles(songPrefix, token) {
    const base = "https://content.dropboxapi.com/2/files/download";

    const createSource = (type) => {
      const audio = createAudioElement(`${type}Audio`);
      audio.src = `${base}`;
      audio.setAttribute("data-dropbox-path", `/WorshipSongs/${songPrefix}_${type}.mp3`);
      return audio;
    };

    vocalAudio = createSource("vocal");
    accompAudio = createSource("acc");

    const applyDropboxHeaders = (audio, type) => {
      fetch(base, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({ path: audio.getAttribute("data-dropbox-path") }),
        },
      })
        .then((res) => res.blob())
        .then((blob) => {
          audio.src = URL.createObjectURL(blob);
          console.log(`🎵 ${type} loaded`);
        })
        .catch((err) => console.error(`❌ Error loading ${type}`, err));
    };

    applyDropboxHeaders(vocalAudio, "Vocal");
    applyDropboxHeaders(accompAudio, "Accompaniment");
  }

  songSelect.addEventListener("change", async () => {
    const songName = songSelect.value;
    const songPrefix = getSongPrefix(songName);
    const token = await fetchDropboxAccessToken();

    if (!token) return;

    try {
      await loadAudioFiles(songPrefix, token);
      const loops = await loadLoopJson(songPrefix, token);
      currentLoops = loops;
      createSegmentButtons();
      console.log("✅ loopManager.js: Fully initialized with loops");
    } catch (err) {
      console.error("❌ loopManager.js: Error during init", err);
    }
  });
});
