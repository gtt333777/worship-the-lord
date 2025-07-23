const fetch = require("node-fetch");

exports.handler = async (event) => {
  // Step 1: Check method
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // Step 2: Parse request body
    const { code, song, loops } = JSON.parse(event.body);

    // Step 3: Check against OWNER_SECRET_CODE set in Netlify
    const expectedCode = process.env.OWNER_SECRET_CODE;

    if (code !== expectedCode) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid owner code" }),
      };
    }

    // Step 4: Prepare to upload to Dropbox
    const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
    const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
    const filePath = `/WorshipSongs/${song}_loops.json`;

    const uploadResponse = await fetch(DROPBOX_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: filePath,
          mode: "overwrite",
          autorename: false,
          mute: true,
        }),
        "Content-Type": "application/octet-stream",
      },
      body: Buffer.from(JSON.stringify(loops)),
    });

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Dropbox upload failed", details: err }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Loops uploaded successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: err.message }),
    };
  }
};
