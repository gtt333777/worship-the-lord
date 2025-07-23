const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const { code, song, loops } = JSON.parse(event.body);

    // ✅ Check owner code securely
    if (code.trim() !== process.env.OWNER_SECRET_CODE) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid owner code" }),
      };
    }

    const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
    const filePath = `/WorshipSongs/${song}_loops.json`;

    // ✅ Manually build the header using clean JSON string
    const apiArg = JSON.stringify({
      path: filePath,
      mode: "overwrite",
      autorename: false,
      mute: true,
    });

    // ✅ Prepare proper headers
    const headers = new fetch.Headers();
    headers.append("Authorization", `Bearer ${DROPBOX_TOKEN}`);
    headers.append("Content-Type", "application/octet-stream");
    headers.append("Dropbox-API-Arg", apiArg);  // NO escaping here

    // ✅ Send request to Dropbox upload API
    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(loops),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Upload failed", details: errorText }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Loop saved successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error", details: err.message }),
    };
  }
};
