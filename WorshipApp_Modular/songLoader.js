// WorshipApp_Modular/songLoader.js

let vocalAudio = new Audio();
let accompAudio = new Audio();

async function streamSelectedSong(tamilName) {
  try {
    // Fetch songs_names.txt to get mapping
    const res = await fetch("lyrics/songs_names.txt");
    const lines = await res.text();
    const entries = lines.trim().split("\n");

    // Find matching line
    const match = entries.find(line => line.trim().endsWith(tamilName.trim()));
    if (!match) {
      alert("Prefix not found for selected song!");
      return;
    }

    const prefix = match.split(" ")[0]; // Get prefix from the first word
    const vocalPath = `/WorshipSongs/${prefix}_vocal.wav.mp3`;
    const accompPath = `/WorshipSongs/${prefix}_acc.wav.mp3`;

    // Get Dropbox token
    const tokenRes = await fetch("/.netlify/functions/getDropboxToken");
    const { access_token } = await tokenRes.json();

    // Generate URLs
    const [vocalURL, accompURL] = await Promise.all([
      getDropboxURL(vocalPath, access_token),
      getDropboxURL(accompPath, access_token)
    ]);

    vocalAudio.src = vocalURL;
    accompAudio.src = accompURL;

    console.log("Audio sources set successfully.");
  } catch (err) {
    console.error("Error streaming audio:", err);
  }
}

async function getDropboxURL(path, token) {
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path })
    }
  });

  if (!res.ok) throw new Error("Download failed");

  return URL.createObjectURL(await res.blob());
}
