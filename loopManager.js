document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded for loopManager.js");

  setTimeout(() => {
    const select = document.querySelector("#songSelect");
    if (!select) {
      console.error("⛔ #songSelect not found");
      return;
    }

    const loopButtonsContainer = document.getElementById("loopButtonsContainer");
    if (!loopButtonsContainer) {
      console.error("⛔ loopButtonsContainer not found");
      return;
    }

    // Create 5 Segment buttons
    for (let i = 0; i < 5; i++) {
      const btn = document.createElement("button");
      btn.textContent = `Segment ${i + 1}`;
      btn.style.margin = "4px";
      btn.className = "segment-btn";
      btn.onclick = () => handleSegmentClick(i);
      loopButtonsContainer.appendChild(btn);
    }

    select.addEventListener("change", () => {
      const selectedSong = select.value.trim();
      console.log("🎵 New song selected:", selectedSong);
      loadAndPlaySong(selectedSong);
    });

    // Load initial song if already selected
    if (select.value.trim()) {
      loadAndPlaySong(select.value.trim());
    }

    console.log("✅ loopManager.js fully initialized.");
  }, 500);
});

async function getDropboxUrl(path) {
  try {
    const res = await fetch("/.netlify/functions/getAccessToken");
    if (!res.ok) throw new Error("Failed to get token");
    const { access_token } = await res.json();
    return `https://content.dropboxapi.com/2/files/download`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Dropbox-API-Arg": JSON.stringify({ path })
      }
    };
  } catch (err) {
    console.error("⛔ getDropboxUrl error:", err);
    return null;
  }
}

async function loadAndPlaySong(songName) {
  const vocalFile = `/WorshipSongs/${songName}_vocal.mp3`;
  const accFile = `/WorshipSongs/${songName}_acc.mp3`;
  const loopsFile = `/WorshipSongs/${songName}_loops.json`;

  console.log("🎵 Vocal URL:", vocalFile);
  console.log("🎵 Accompaniment URL:", accFile);
  console.log("🔁 Loops JSON:", loopsFile);

  const audioContext = new AudioContext();
  const [vocalAudio, accAudio] = [new Audio(), new Audio()];
  vocalAudio.crossOrigin = "anonymous";
  accAudio.crossOrigin = "anonymous";

  // Load Loops
  try {
    const res = await fetch(`https://content.dropboxapi.com/2/files/download`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(await fetch("/.netlify/functions/getAccessToken").then(r => r.json())).access_token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: loopsFile })
      }
    });

    if (!res.ok) throw new Error("Failed to fetch loops JSON");
    const loopData = await res.json();
    console.log("✅ Loop data loaded:", loopData);
  } catch (err) {
    console.error("⛔ Failed to load loop JSON:", err);
  }

  // Load and play audio tracks
  try {
    const token = await fetch("/.netlify/functions/getAccessToken").then(r => r.json()).then(j => j.access_token);

    [vocalAudio.src, accAudio.src] = [
      `https://dl.dropboxusercontent.com/2/files/download?arg={"path":"${vocalFile}"}`,
      `https://dl.dropboxusercontent.com/2/files/download?arg={"path":"${accFile}"}`
    ];

    vocalAudio.load();
    accAudio.load();

    vocalAudio.play();
    accAudio.play();

    console.log("▶️ Playing audio");
  } catch (err) {
    console.error("⛔ Error loading audio files:", err);
  }
}

function handleSegmentClick(index) {
  console.log(`🔁 User clicked Segment ${index + 1}`);
  // Future implementation: jump to selected loop segment
}
