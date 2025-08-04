document.addEventListener('DOMContentLoaded', () => {
  const songSelect = document.querySelector('#songSelect');
  const lyricsTextArea = document.querySelector('#lyricsTextArea');
  const loopButtonsContainer = document.querySelector('#loopButtonsContainer');

  if (!songSelect || !lyricsTextArea || !loopButtonsContainer) {
    console.warn('songLoader.js: #songSelect, #lyricsTextArea, and #loopButtonsContainer not found');
    return;
  }

  songSelect.addEventListener('change', async () => {
    const tamilName = songSelect.value;
    console.log('songLoader.js: Song selected:', tamilName);

    const selectedOption = [...songSelect.options].find(opt => opt.value === tamilName);
    const suffix = selectedOption?.dataset?.suffix;
    if (!suffix) {
      console.error('songLoader.js: No suffix found for selected song');
      return;
    }

    // Assign Dropbox audio URLs
    const vocalUrl = `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${DROPBOX_TOKEN}&arg={"path":"/WorshipSongs/${suffix}_vocal.mp3"}`;
    const accUrl = `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${DROPBOX_TOKEN}&arg={"path":"/WorshipSongs/${suffix}_acc.mp3"}`;

    if (window.vocalAudio && window.accompAudio) {
      window.vocalAudio.src = vocalUrl;
      window.accompAudio.src = accUrl;
    }

    console.log('songLoader.js: Assigned Dropbox audio URLs:');
    console.log('🎤 Vocal:', vocalUrl);
    console.log('🎹 Accompaniment:', accUrl);

    // Fetch and render loop segments
    const loopUrl = `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${DROPBOX_TOKEN}&arg={"path":"/WorshipSongs/${suffix}_loops.json"}`;

    try {
      const response = await fetch(loopUrl);
      const loopData = await response.json();

      console.log(`songLoader.js: Loaded ${loopData.length} loop segments`);

      renderLoopButtons(loopData);
      window.currentLoops = loopData; // for playback logic
    } catch (err) {
      console.warn('songLoader.js: Failed to load loop JSON:', err);
      loopButtonsContainer.innerHTML = '';
    }
  });

  function renderLoopButtons(loopData) {
    loopButtonsContainer.innerHTML = '';
    loopData.forEach((loop, index) => {
      const btn = document.createElement('button');
      btn.className = 'segment-button';
      btn.textContent = `Segment ${index + 1}`;
      btn.addEventListener('click', () => playFromLoopSegment(index));
      loopButtonsContainer.appendChild(btn);
    });
  }

  function playFromLoopSegment(index) {
    if (!window.currentLoops || !window.vocalAudio || !window.accompAudio) return;

    const start = window.currentLoops[index].start;
    vocalAudio.currentTime = start;
    accompAudio.currentTime = start;

    vocalAudio.play();
    accompAudio.play();
  }
});
