const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const { songName, loopsJson, ownerCode } = JSON.parse(event.body || '{}');

  // Validate environment variables
  const {
    DROPBOX_APP_KEY,
    DROPBOX_APP_SECRET,
    DROPBOX_REFRESH_TOKEN,
    OWNER_SECRET_CODE
  } = process.env;

  if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !DROPBOX_REFRESH_TOKEN || !OWNER_SECRET_CODE) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' }),
    };
  }

  // ✅ Step 1: Validate owner
  if (ownerCode !== OWNER_SECRET_CODE) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Invalid owner code' }),
    };
  }

  // ✅ Step 2: Generate access token from refresh token
  const tokenResponse = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: 'POST',
    headers: {
      "Authorization": "Basic " + Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: DROPBOX_REFRESH_TOKEN,
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to obtain Dropbox access token' }),
    };
  }

  // ✅ Step 3: Upload the _loops.json to Dropbox
  const filePath = `/WorshipSongs/${songName}_loops.json`;

  const uploadResponse = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: filePath,
        mode: "overwrite",
        autorename: false,
        mute: true,
        strict_conflict: false
      }),
      "Content-Type": "application/octet-stream"
    },
    body: Buffer.from(JSON.stringify(loopsJson)),
  });

  const uploadResult = await uploadResponse.json();

  if (uploadResponse.ok) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Loop uploaded successfully', details: uploadResult }),
    };
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to upload file to Dropbox', details: uploadResult }),
    };
  }
};
