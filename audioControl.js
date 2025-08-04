function prepareAudioFromDropbox() {
  console.log("audioControl.js: prepareAudioFromDropbox() called");

  if (!window.currentAudioUrls) {
    console.warn("No audio URLs found yet");
    return;
  }

  const { vocalUrl, accUrl, accessToken, vocalName, accName } = window.currentAudioUrls;

  // Fetch vocal MP3
  fetch(vocalUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/WorshipSongs/${vocalName}`
      })
    }
  })
    .then(res => res.blob())
    .then(blob => {
      vocalAudio.src = URL.createObjectURL(blob);
      console.log("🎧 Vocal audio prepared");
    })
    .catch(err => console.error("❌ Failed to load vocal:", err));

  // Fetch accompaniment MP3
  fetch(accUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/WorshipSongs/${accName}`
      })
    }
  })
    .then(res => res.blob())
    .then(blob => {
      accompAudio.src = URL.createObjectURL(blob);
      console.log("🎹 Accompaniment audio prepared");
    })
    .catch(err => console.error("❌ Failed to load accompaniment:", err));
}
