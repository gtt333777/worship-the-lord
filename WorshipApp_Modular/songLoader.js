// WorshipApp_Modular/songLoader.js

async function streamSelectedSong(tamilName) {
  try {
    const response = await fetch("lyrics/songs_names.txt");
    const lines = (await response.text()).split("\n").map(line => line.trim()).filter(Boolean);
    
    let prefix = null;
    for (const line of lines) {
      const [pfx, name] = line.split("=");
      if (name.trim() === tamilName.trim()) {
        prefix = pfx.trim();
        break;
      }
    }

    if (!prefix) {
      alert("Prefix not found for selected song!");
      return;
    }

    const vocalUrl = `https://content.dropboxapi.com/2/files/download`;
    const accompUrl = `https://content.dropboxapi.com/2/files/download`;

    const headers = {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Dropbox-API-Arg": JSON.stringify({ path: `/WorshipSongs/${prefix}_vocal.wav.mp3` })
    };
    const headers2 = {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Dropbox-API-Arg": JSON.stringify({ path: `/WorshipSongs/${prefix}_acc.wav.mp3` })
    };

    const vocalBlob = await fetch(vocalUrl, { method: "POST", headers }).then(r => r.blob());
    const accompBlob = await fetch(accompUrl, { method: "POST", headers: headers2 }).then(r => r.blob());

    vocalAudio.src = URL.createObjectURL(vocalBlob);
    accompAudio.src = URL.createObjectURL(accompBlob);
    console.log("Audio files loaded successfully.");
  } catch (err) {
    console.error("Error streaming audio:", err);
  }
}

window.streamSelectedSong = streamSelectedSong;
