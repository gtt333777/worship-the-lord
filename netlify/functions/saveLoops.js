const fetch = require("node-fetch");

const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const OWNER_SECRET_CODE = process.env.OWNER_SECRET_CODE;

exports.handler = async (event) => {
  try {
    const { ownerCode, songName, loops } = JSON.parse(event.body);

    // ✅ Check owner secret
    if (ownerCode !== OWNER_SECRET_CODE) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Unauthorized access" }),
      };
    }

    // ✅ Get short-lived Dropbox access token using refresh token
    const auth = Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: DROPBOX_REFRESH_TOKEN
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Token fetch failed", details: tokenData }),
      };
    }

    const accessToken = tokenData.access_token;

    // ✅ Upload loops JSON to Dropbox
    const uploadPath = `/WorshipSongs/${songName}_loops.json`;
    const dropboxRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: uploadPath,
          mode: "overwrite",
          autorename: false
        })
      },
      body: JSON.stringify(loops)
    });

    const dropboxData = await dropboxRes.json();

    if (dropboxRes.status !== 200) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Upload failed", details: dropboxData }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Loops saved successfully", metadata: dropboxData }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error", details: err.message }),
    };
  }
};
