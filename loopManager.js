// WorshipApp_Modular/loopManager.js
console.log("loopManager.js: Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const interval = setInterval(() => {
    const songSelect = document.getElementById("songSelect");
    const loopButtonsContainer = document.getElementById("loopButtonsContainer");
    if (!songSelect || !loopButtonsContainer) {
      console.log("loopManager.js: Waiting for DOM elements...");
      return;
    }
    clearInterval(interval);
    console.log("loopManager.js: DOM ready");

    songSelect.addEventListener("change", async () => {
      const songName = songSelect.value.trim();
      console.log("🎧 New song selected:", songName);

      const vocalUrl = await getDropboxUrl(`${songName}_vocal.mp3`);
      const accUrl = await getDropboxUrl(`${songName}_acc.mp3`);
      const loopsUrl = `lyrics/${encodeURIComponent(songName)}_loops.json`;

      console.log("🎵 Vocal URL:", vocalUrl);
      console.log("🎵 Accompaniment URL:", accUrl);
      console.log("📁 Loops JSON:", loopsUrl);

      const vocalAudio = new Audio(vocalUrl);
      const accAudio = new Audio(accUrl);
      vocalAudio.crossOrigin = "anonymous";
      accAudio.crossOrigin = "anonymous";

      fetch(loopsUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Loop JSON not found");
          return res.json();
        })
        .then((segments) => {
          renderSegmentButtons(segments, vocalAudio, accAudio);
        })
        .catch((err) => {
          console.error("❌ Error loading loop JSON:", err);
        });
    });
  }, 200);
});

async function getDropboxUrl(filename) {
  try {
    const res = await fetch("/.netlify/functions/getAccessToken");
    if (!res.ok) throw new Error("Failed to get token");
    const { access_token } = await res.json();

    const path = `/WorshipSongs/${filename}`;
    const url = `https://content.dropboxapi.com/2/files/download`;

    const audioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
    });

    if (!audioRes.ok) throw new Error("Audio fetch failed");

    const blob = await audioRes.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("❌ getDropboxUrl error:", e);
    return "";
  }
}

function renderSegmentButtons(segments, vocalAudio, accAudio) {
  const container = document.getElementById("loopButtonsContainer");
  container.innerHTML = "";

  let currentTimeout = null;

  segments.forEach((seg, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Segment ${index + 1}`;
    btn.style.padding = "10px";
    btn.style.borderRadius = "12px";
    btn.style.background = "#89CFF0";
    btn.style.fontWeight = "bold";
    btn.style.cursor = "pointer";
    btn.style.border = "1px solid #333";

    btn.addEventListener("click", () => {
      clearTimeout(currentTimeout);
      vocalAudio.pause();
      accAudio.pause();

      vocalAudio.currentTime = seg.start;
      accAudio.currentTime = seg.start;

      vocalAudio.play();
      accAudio.play();

      console.log(`🔁 Playing Segment ${index + 1} (${seg.start}s to ${seg.end}s)`);

      const duration = (seg.end - seg.start) * 1000;
      currentTimeout = setTimeout(() => {
        vocalAudio.pause();
        accAudio.pause();

        // Auto-play next segment if exists
        if (index + 1 < segments.length) {
          container.children[index + 1].click();
        } else {
          console.log("✅ Finished all segments.");
        }
      }, duration);
    });

    container.appendChild(btn);
  });
}
