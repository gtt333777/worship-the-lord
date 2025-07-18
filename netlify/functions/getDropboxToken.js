const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
  const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
  const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;

  const authHeader = Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString("base64");
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", DROPBOX_REFRESH_TOKEN);

  try {
    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Dropbox token request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: data.access_token })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
