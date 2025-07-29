// songLoader.js

async function streamSelectedSong(selectedTamilName) {
  const prefix = window.songPrefixMap?.[selectedTamilName];

  if (!prefix) {
    alert("Prefix not found for selected song!");
    return;
  }

  // Get access token from global variable
  const accessToken = window.ACCESS_TOKEN;

  // Set URLs for vocal and accompaniment
  const basePath = "/WorshipSongs/";
  const vocalPath = `${basePath}${prefix}_vocal.wav.mp3`;
  const accompPath = `${basePath}${prefix}_acc.wav.mp3`;

  const dropboxApiUrl = "https://content.dropboxapi.com/2/files/download";

  // Fetch function
  async function fetchAudio(urlPath) {
    const res = await fetch(dropboxApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path: urlPath })
      }
    });
    if (!res.ok) throw new Error("Download failed");
    return URL.createObjectURL(await res.blob());
  }

  try {
    const [vocalURL, accompURL] = await Promise.all([
      fetchAudio(vocalPath),
      fetchAudio(accompPath)
    ]);

    // Create audio elements
    window.vocalAudio = new Audio(vocalURL);
    window.accompAudio = new Audio(accompURL);

    // Sync and loop behavior (if needed)
    vocalAudio.onplay = () => accompAudio.play();
    vocalAudio.onpause = () => accompAudio.pause();

    console.log("Audio streaming ready.");
  } catch (err) {
    console.error("Failed to stream audio:", err);
    alert("Audio load failed!");
  }
}
