const { Request } = require('node-fetch');
const fetch = require('node-fetch');

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

    const dropboxArgs = {
      path: filePath,
      mode: "overwrite",
      autorename: false,
      mute: true,
    };

    // ✅ Build the Request manually to avoid escaping issues
    const req = new Request('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify(dropboxArgs),
      },
      body: JSON.stringify(loops)
    });

    const res = await fetch(req);

    if (!res.ok) {
      const text = await res.text();
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
