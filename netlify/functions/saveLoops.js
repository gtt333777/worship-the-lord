const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const { code, song, loops } = JSON.parse(event.body);

    if (code.trim() !== process.env.OWNER_SECRET_CODE) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid owner code" }),
      };
    }

    const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
    const filePath = `/WorshipSongs/${song}_loops.json`;

    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/octet-stream",
        // ⚠️ Fix: Use JSON string here directly. Do NOT encode or escape manually.
        "Dropbox-API-Arg": JSON.stringify({
          path: filePath,
          mode: "overwrite",
          autorename: false,
          mute: true
        })
      },
      // ✅ Body must be plain JSON string of loop data
      body: JSON.stringify(loops)
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Upload failed", details: text }),
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
