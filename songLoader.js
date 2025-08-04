document.addEventListener('DOMContentLoaded', () => {
  const waitForElements = setInterval(() => {
    const songSelect = document.querySelector('#songSelect');
    const lyricsTextArea = document.querySelector('#lyricsTextArea');
    const loopButtonsContainer = document.querySelector('#loopButtonsContainer');

    if (!songSelect || !lyricsTextArea || !loopButtonsContainer) {
      console.warn('⏳ songLoader.js: Waiting for elements to load...');
      return; // wait more
    }

    clearInterval(waitForElements); // all elements ready

    songSelect.addEventListener('change', async () => {
      const tamilName = songSelect.value;
      console.log('🎵 songLoader.js: Song selected:', tamilName);

      const selectedOption = [...songSelect.options].find(opt => opt.value === tamilName);
      const suffix = selectedOption?.dataset?.suffix;
      if (!suffix) {
        console.error('❌ songLoader.js: No suffix found for selected song');
        return;
      }

      // Set audio sources
      const vocalUrl = `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${DROPBOX_TOKEN}&arg={"path":"/WorshipSongs/${suffix}_vocal.mp3"}`;
      const accUrl = `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${DROPBOX_TOKEN}&arg={"path":"/WorshipSongs/${suffix}_acc.mp3"}`;
      if (window.vocalAudio && window.accompAudio) {
        window.vocalAudio.src = vocalUrl;
        window.accompAudio.src = accUrl;
      }

      console.log('🎤 Vocal:', vocalUrl);
      console.log('🎹 Accompaniment:', accUrl);

      // Load loop segments
      const loopUrl = `https://content.dropboxapi.com/2/files/download?authorization=Bearer ${DROPBOX_TOKEN}&arg={"path":"/WorshipSongs/${suffix}_loops.json"}`;
      try {
        const response = await fetch(loopUrl);
        const loopData = await response.json();
        window.currentLoops = loopData;
        console.log(`🔁 Loaded ${loopData.length} loop segments`);
        renderLoopButtons(loopData);
      } catch (err) {
        console.warn('⚠️ Could not load loops:', err);
        loopButtonsContainer.innerHTML = '';
      }
    });

    function renderLoopButtons(loopData) {
      const container = document.querySelector('#loopButtonsContainer');
      if (!container) {
        console.error('❌ renderLoopButtons: Container not found');
        return;
      }
      container.innerHTML = '';
      loopData.forEach((loop, index) => {
        const btn = document.createElement('button');
        btn.className = 'segment-button';
        btn.textContent = `Segment ${index + 1}`;
        btn.addEventListener('click', () => playFromLoopSegment(index));
        container.appendChild(btn);
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
  }, 200); // retry every 200ms
});
