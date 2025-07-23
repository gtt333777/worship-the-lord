const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  try {
    const { code, song, loops } = JSON.parse(event.body);

    const OWNER_SECRET_CODE = process.env.OWNER_SECRET_CODE;

    if (code.trim() !== OWNER_SECRET_CODE) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid owner code" }),
      };
    }

    const filePath = `/WorshipSongs/${song}_loops.json`;

    const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: encodeURI(filePath), // ✅ Encode for Tamil/Unicode
          mode: "overwrite",
          autorename: false,
          mute: true
        }),
      },
      body: JSON.stringify(loops),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server error", details: result }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Loops uploaded successfully" }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error", details: err.message }),
    };
  }
};
