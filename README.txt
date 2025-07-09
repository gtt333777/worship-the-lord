WORSHIP THE LORD - Simple Karaoke Stem App

===========================================
Description
-------------------------------------------
This app lets you:
- Play worship song stems (vocals.wav + accompaniment.wav) together and adjust their volumes
- Scroll, bold, large lyrics below while singing
- Send simple messages (local, non-shared) in the message board
- All in one page, mobile friendly, no backend required

How to Use
-------------------------------------------
1. Visit the site (hosted on GitHub Pages or anywhere).
2. Click the "Go to Library" button to browse/download worship song files from Podia.
3. On the main app:
   - Click "Choose Vocals WAV" and select your vocals.wav file.
   - Click "Choose Accompaniment WAV" and select your accompaniment.wav file.
   - Make sure both files have the same song prefix name.
   - Click "Load Song" to activate the player and show lyrics.
   - Click "Play" to start both files in sync; adjust each volume with the sliders.
   - Manually scroll lyrics as needed below the player.
4. Message board lets you post local (temporary) notes/greetings (not shared across devices).

How to Add/Update Lyrics
-------------------------------------------
- Open main.js and add new lyrics in the `lyricsLibrary` object using the filename prefix as the key.

Example:
  "Song Title Prefix": `Full lyrics here...`,

- Make sure the song prefix matches both audio files and lyrics.

Customization
-------------------------------------------
- Update colors, title, or button text in index.html for your group.
- Edit/expand the lyrics library in main.js.

Deployment
-------------------------------------------
- You can host this app for free on GitHub Pages (recommended) or Netlify/Vercel.
- Only two files required: index.html and main.js (plus this README).
- All lyrics and player logic runs in the browser, no server needed.

Audio Files
-------------------------------------------
- Store your .wav files on Podia, Dropbox, or any cloud service and download as needed.
- This app does not host or stream the files directly.

Support
-------------------------------------------
Questions? Just ask ChatGPT for help updating, customizing, or deploying the app!

Blessings and happy singing!
