// === Global Audio Elements ===
let vocalAudio = new Audio();
let accompAudio = new Audio();

// === Play Both in Sync ===
async function playSong() {
  const tamilName = document.getElementById("songSelect").value;
  console.log("🎶 Play requested for:", tamilName);

  const vocalFile = tamilName + "_vocal.mp3";
  const accompFile = tamilName + "_acc.mp3";

  try {
    const [vocalURL, accompURL] = await Promise.all([
      getDropboxFileURL(vocalFile),
      getDropboxFileURL(accompFile)
    ]);

    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;

    await Promise.all([
      vocalAudio.play(),
      accompAudio.play()
    ]);

    console.log("▶️ Both vocal and accompaniment playing.");
  } catch (err) {
    console.error("❌ Error loading audio:", err);
  }
}

// === Pause Both ===
function pauseSong() {
  vocalAudio.pause();
  accompAudio.pause();
  console.log("⏸ Paused both tracks.");
}

// === Volume Control ===
function adjustVolume(type, delta) {
  const audio = type === "vocal" ? vocalAudio : accompAudio;
  let newVolume = audio.volume + delta;
  newVolume = Math.min(1, Math.max(0, newVolume));
  audio.volume = newVolume;

  const slider = document.getElementById(`${type}Volume`);
  if (slider) slider.value = newVolume;

  console.log(`🔊 ${type} volume:`, newVolume.toFixed(2));
}

// === Seek + / - 1 sec ===
function seek(delta) {
  const newTime = vocalAudio.currentTime + delta;
  vocalAudio.currentTime = Math.max(0, newTime);
  accompAudio.currentTime = Math.max(0, newTime);
  console.log(`⏩ Jumped to: ${vocalAudio.currentTime.toFixed(1)}s`);
}

// === Setup Volume Sliders ===
["vocal", "accomp"].forEach(type => {
  const slider = document.getElementById(`${type}Volume`);
  if (slider) {
    slider.addEventListener("input", (e) => {
      const audio = type === "vocal" ? vocalAudio : accompAudio;
      audio.volume = parseFloat(e.target.value);
    });
  }
});
