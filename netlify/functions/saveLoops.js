// netlify/functions/saveLoops.js

const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const { code, song, loops } = JSON.parse(event.body);

    // Owner-only access check
    if (code.trim() !== process.env.OWNER_SECRET_CODE) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid owner code" }),
      };
    }

    // Dropbox access token from env variable
    const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

    const filePath = `/WorshipSongs/${song}_loops.json`;

    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": encodeURIComponent(JSON.stringify({
          path: filePath,
          mode: "overwrite",
          autorename: false,
          mute: true
        })),
      },
      body: JSON.stringify(loops),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server error", details: errorText }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Loops saved successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error", details: err.message }),
    };
  }
};
