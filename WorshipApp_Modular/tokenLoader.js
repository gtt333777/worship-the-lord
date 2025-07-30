let ACCESS_TOKEN = "";

async function loadDropboxToken() {
  try {
    const res = await fetch("/.netlify/functions/getDropboxToken");
    const data = await res.json();
    ACCESS_TOKEN = data.access_token;
    console.log("Dropbox token loaded successfully!");
  } catch (err) {
    console.error("Failed to fetch Dropbox token:", err);
  }
}

export { loadDropboxToken, ACCESS_TOKEN };
