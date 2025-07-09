// main.js

document.addEventListener("DOMContentLoaded", () => {
  fetch('songs.json')
    .then(res => res.json())
    .then(songs => {
      const listDiv = document.getElementById('song-list');
      songs.forEach(song => {
        // Song Container
        const songDiv = document.createElement('div');
        songDiv.className = 'song-block';
        
        // Title
        const title = document.createElement('h2');
        title.textContent = song.displayName;
        songDiv.appendChild(title);

        // Accompaniment Player
        const accompAudio = document.createElement('audio');
        accompAudio.controls = true;
        accompAudio.src = `https://drive.google.com/uc?export=download&id=${song.accompFileId}`;
        accompAudio.title = 'Accompaniment Only';
        songDiv.appendChild(document.createTextNode('Accompaniment: '));
        songDiv.appendChild(accompAudio);

        // Vocals Player
        const vocalsAudio = document.createElement('audio');
        vocalsAudio.controls = true;
        vocalsAudio.src = `https://drive.google.com/uc?export=download&id=${song.vocalsFileId}`;
        vocalsAudio.title = 'Vocals Only';
        songDiv.appendChild(document.createElement('br'));
        songDiv.appendChild(document.createTextNode('Vocals: '));
        songDiv.appendChild(vocalsAudio);

        // Lyrics PDF
        if (song.lyricsPdfFileId) {
          const lyricsFrame = document.createElement('iframe');
          lyricsFrame.src = `https://drive.google.com/file/d/${song.lyricsPdfFileId}/preview`;
          lyricsFrame.width = "100%";
          lyricsFrame.height = "480";
          lyricsFrame.style = "border:1px solid #bbb; margin-top:15px; margin-bottom:20px;";
          songDiv.appendChild(document.createElement('br'));
          songDiv.appendChild(document.createTextNode('Lyrics:'));
          songDiv.appendChild(document.createElement('br'));
          songDiv.appendChild(lyricsFrame);
        }

        // Add to main list
        listDiv.appendChild(songDiv);
      });
    });
});
