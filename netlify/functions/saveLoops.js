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

    const dropboxArg = {
      path: filePath,
      mode: "overwrite",
      autorename: false,
      mute: true,
    };

    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/octet-stream",
        // ✅ Use utf8-encoded JSON string (no manual escaping!)
        "Dropbox-API-Arg": Buffer.from(JSON.stringify(dropboxArg)).toString("utf8")
      },
      body: Buffer.from(JSON.stringify(loops), "utf8") // Send body in UTF-8
    });

    const resultText = await response.text();
    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Upload failed", details: resultText }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Loop saved successfully", result: resultText }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error", details: err.message }),
    };
  }
};
