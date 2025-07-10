WORSHIP THE LORD - README
=========================

OVERVIEW
--------
This is a simple, modern web app for singing and playing along with Christian worship songs.

- Each song is represented by three files, all hosted on Google Drive:
    • vocals.wav   (lead vocal only)
    • accompaniment.wav (music/instruments only)
    • lyrics.pdf   (large, readable lyrics)
- All song data (names and file links) is stored in songs.json.
- No database, backend, or login required. All users can play songs and view lyrics instantly.

FILES
-----
• index.html  -- main app user interface
• main.js     -- logic to load/play both tracks, control volumes, and show PDF lyrics
• songs.json  -- list of all songs with Google Drive links (edit this to add/remove songs)

HOW TO USE
----------
1. Place index.html, main.js, and songs.json in the same folder.
2. Upload your wav and pdf files to Google Drive, set them to "Anyone with the link can view".
3. Paste each file's share link in songs.json under the correct keys for each song (see example).
4. Open index.html in a browser (preferably via local server for best performance).
5. For each song, press "Play Both" to hear vocals+music, use volume controls, and scroll lyrics below.

EXAMPLE: songs.json entry
-------------------------
[
  {
    "displayName": "My Worship Song",
    "vocalsFileId": "https://drive.google.com/file/d/....../view?usp=sharing",
    "accompFileId": "https://drive.google.com/file/d/....../view?usp=sharing",
    "lyricsPdfFileId": "https://drive.google.com/file/d/....../view?usp=sharing"
  }
]

NOTES
-----
• To add songs, just copy/paste a block in songs.json and change the links.
• All songs will be displayed alphabetically.
• If a PDF is missing, a message will show instead.
• For best audio performance, use Chrome or Firefox on desktop.
• For mobile, layout will adjust and PDF remains scrollable.

KNOWN LIMITATIONS
-----------------
• Google Drive streaming may not work with very large files, or if Drive link permissions are not set correctly.
• All users can stream but not download from the app (downloading is possible from Drive if link is shared).
• There is no real-time lyric sync—lyrics must be manually scrolled while singing.

CREDITS & SUPPORT
-----------------
App concept: [Your Name]
App code: ChatGPT + [Your Name]

For improvements, new features, or help, just ask!

