// netlify/functions/get-dropbox-token.js

exports.handler = async function () {
  const CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
  const CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing env variables" }),
    };
  }

  const tokenUrl = "https://api.dropbox.com/oauth2/token";
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", REFRESH_TOKEN);

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Token fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: data.access_token }),
    };
  } catch (err) {
    console.error("❌ Dropbox token error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Token fetch failed" }),
    };
  }
};
