async function fetchSongs() {
    // Load songs.json dynamically
    const res = await fetch('songs.json');
    return await res.json();
}

function getDriveAudioSrc(url) {
    // Converts normal GDrive link to direct download link
    const match = url.match(/\/d\/([^\/]+)\//);
    if (!match) return "";
    return `https://docs.google.com/uc?export=download&id=${match[1]}`;
}

function getDrivePdfEmbed(url) {
    // Embed GDrive PDF for viewing
    const match = url.match(/\/d\/([^\/]+)\//);
    if (!match) return "";
    return `https://drive.google.com/file/d/${match[1]}/preview`;
}

function createVolControl(label, audio) {
    // Returns a div with label, -/+, and live volume %
    const div = document.createElement('div');
    div.className = 'vol-controls';
    div.innerHTML = `${label}: 
      <button class="vol-minus">-</button>
      <span class="vol-level">${Math.round(audio.volume * 100)}</span>%
      <button class="vol-plus">+</button>
    `;
    div.querySelector('.vol-minus').onclick = () => {
        audio.volume = Math.max(0, audio.volume - 0.05);
        div.querySelector('.vol-level').innerText = Math.round(audio.volume * 100);
    };
    div.querySelector('.vol-plus').onclick = () => {
        audio.volume = Math.min(1, audio.volume + 0.05);
        div.querySelector('.vol-level').innerText = Math.round(audio.volume * 100);
    };
    // Update display if user changes slider (e.g., via browser controls)
    audio.addEventListener('volumechange', () => {
        div.querySelector('.vol-level').innerText = Math.round(audio.volume * 100);
    });
    return div;
}

function createSongBlock(song) {
    const block = document.createElement('div');
    block.className = 'song-block';

    // Song title
    const h2 = document.createElement('h2');
    h2.innerText = song.displayName;
    block.appendChild(h2);

    // Prepare audio elements
    const vocalsAudio = document.createElement('audio');
    vocalsAudio.src = getDriveAudioSrc(song.vocalsFileId);
    vocalsAudio.preload = "none";
    vocalsAudio.controls = false;

    const accompAudio = document.createElement('audio');
    accompAudio.src = getDriveAudioSrc(song.accompFileId);
    accompAudio.preload = "none";
    accompAudio.controls = false;

    vocalsAudio.volume = 0.8;
    accompAudio.volume = 0.8;

    // Play/pause both in sync
    let isPlaying = false;
    const playBtn = document.createElement('button');
    playBtn.innerText = "▶️ Play Both";
    playBtn.style.marginBottom = "10px";
    playBtn.onclick = async () => {
        if (!isPlaying) {
            // Start from beginning if paused
            vocalsAudio.currentTime = accompAudio.currentTime = 0;
            await vocalsAudio.play();
            await accompAudio.play();
            isPlaying = true;
            playBtn.innerText = "⏸ Pause Both";
        } else {
            vocalsAudio.pause();
            accompAudio.pause();
            isPlaying = false;
            playBtn.innerText = "▶️ Play Both";
        }
    };

    // Keep them in sync (pause/play/ended)
    vocalsAudio.onpause = accompAudio.onpause = () => {
        if (!vocalsAudio.paused || !accompAudio.paused) return;
        isPlaying = false;
        playBtn.innerText = "▶️ Play Both";
    };
    vocalsAudio.onended = accompAudio.onended = () => {
        isPlaying = false;
        playBtn.innerText = "▶️ Play Both";
    };

    // Sync seeking
    vocalsAudio.ontimeupdate = () => {
        if (Math.abs(vocalsAudio.currentTime - accompAudio.currentTime) > 0.15) {
            accompAudio.currentTime = vocalsAudio.currentTime;
        }
    };
    accompAudio.ontimeupdate = () => {
        if (Math.abs(vocalsAudio.currentTime - accompAudio.currentTime) > 0.15) {
            vocalsAudio.currentTime = accompAudio.currentTime;
        }
    };

    // Audio controls
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = "flex";
    controlsDiv.style.alignItems = "center";
    controlsDiv.style.gap = "1em";
    controlsDiv.appendChild(playBtn);

    // Volume controls
    controlsDiv.appendChild(createVolControl("Vocal Vol", vocalsAudio));
    controlsDiv.appendChild(createVolControl("Music Vol", accompAudio));

    block.appendChild(controlsDiv);

    // Show browser controls if needed
    const details = document.createElement('details');
    details.style.marginBottom = "8px";
    details.innerHTML = `<summary style="cursor:pointer;">Show advanced player controls</summary>`;
    const controlsBox = document.createElement('div');
    controlsBox.appendChild(document.createTextNode("Vocal:"));
    controlsBox.appendChild(vocalsAudio);
    controlsBox.appendChild(document.createTextNode("Music:"));
    controlsBox.appendChild(accompAudio);
    details.appendChild(controlsBox);
    block.appendChild(details);

    // Lyrics PDF (as embedded)
    if (song.lyricsPdfFileId) {
        const pdfFrame = document.createElement('iframe');
        pdfFrame.className = 'pdf-holder';
        pdfFrame.src = getDrivePdfEmbed(song.lyricsPdfFileId);
        pdfFrame.allow = "autoplay";
        pdfFrame.frameBorder = "0";
        pdfFrame.width = "100%";
        pdfFrame.height = "500";
        block.appendChild(pdfFrame);
    } else {
        const noLyrics = document.createElement('div');
        noLyrics.innerText = "No lyrics PDF available.";
        block.appendChild(noLyrics);
    }

    return block;
}

// Main execution
fetchSongs().then(songs => {
    // Sort by displayName, case insensitive
    songs.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
    const songListDiv = document.getElementById('song-list');
    songListDiv.innerHTML = '';
    songs.forEach(song => songListDiv.appendChild(createSongBlock(song)));
});
