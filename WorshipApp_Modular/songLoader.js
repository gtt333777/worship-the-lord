// songLoader.js
export let vocalAudio = new Audio();
export let accompAudio = new Audio();

export function setupVolumeControls() {
  const vocalSlider = document.getElementById("vocalVolume");
  const accompSlider = document.getElementById("accompVolume");

  vocalSlider.addEventListener("input", (e) => {
    vocalAudio.volume = parseFloat(e.target.value);
  });

  accompSlider.addEventListener("input", (e) => {
    accompAudio.volume = parseFloat(e.target.value);
  });
}

export function loadAudioFiles(songName, accessToken) {
  const folder = "/WorshipSongs/";
  const vocalPath = folder + songName + "_vocal.mp3";
  const accompPath = folder + songName + "_acc.mp3";

  const headers = new Headers({
    "Authorization": "Bearer " + accessToken,
    "Dropbox-API-Arg": JSON.stringify({ path: vocalPath })
  });

  fetch("https://content.dropboxapi.com/2/files/download", { method: "POST", headers })
    .then(res => res.blob())
    .then(blob => {
      vocalAudio.src = URL.createObjectURL(blob);
      vocalAudio.load();
    }).catch(err => console.error("Error loading vocal:", err));

  const accompHeaders = new Headers({
    "Authorization": "Bearer " + accessToken,
    "Dropbox-API-Arg": JSON.stringify({ path: accompPath })
  });

  fetch("https://content.dropboxapi.com/2/files/download", { method: "POST", headers: accompHeaders })
    .then(res => res.blob())
    .then(blob => {
      accompAudio.src = URL.createObjectURL(blob);
      accompAudio.load();
    }).catch(err => console.error("Error loading accompaniment:", err));
}

export async function playBoth() {
  try {
    await Promise.all([vocalAudio.play(), accompAudio.play()]);
  } catch (err) {
    console.error("Playback error:", err);
  }
}

export function pauseBoth() {
  vocalAudio.pause();
  accompAudio.pause();
}

export function syncDuringPlayback() {
  vocalAudio.onplay = () => accompAudio.play();
  vocalAudio.onpause = () => accompAudio.pause();
  vocalAudio.onseeking = () => accompAudio.currentTime = vocalAudio.currentTime;
  vocalAudio.ontimeupdate = () => {
    const diff = Math.abs(vocalAudio.currentTime - accompAudio.currentTime);
    if (diff > 0.3) {
      accompAudio.currentTime = vocalAudio.currentTime;
    }
  };
}
