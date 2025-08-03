// loopManager.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Loaded: loopManager.html');

  const loopButtonsContainer = document.getElementById('loopButtonsContainer');
  let audioContext, vocalSource, accSource;
  let vocalBuffer, accBuffer;
  let segments = [];
  let currentSegmentIndex = 0;
  let isPlaying = false;

  async function getAccessToken() {
    try {
      const response = await fetch('/functions/getAccessToken'); // ✅ Fixed path
      if (!response.ok) throw new Error('Access token fetch failed');
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('❌ getAccessToken error:', error);
      throw error;
    }
  }

  async function getDropboxAudioBuffer(filename, accessToken) {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: `/WorshipSongs/${filename}`
        })
      }
    });

    if (!response.ok) {
      throw new Error(`❌ Failed to fetch ${filename}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  async function loadAndPlaySegment(index) {
    if (!segments[index]) return;
    const { start, end } = segments[index];
    currentSegmentIndex = index;

    // Stop if already playing
    if (isPlaying && vocalSource && accSource) {
      vocalSource.stop();
      accSource.stop();
      console.log('⛔️ Stopped previous segment.');
    }

    isPlaying = true;
    vocalSource = audioContext.createBufferSource();
    accSource = audioContext.createBufferSource();
    vocalSource.buffer = vocalBuffer;
    accSource.buffer = accBuffer;

    vocalSource.connect(audioContext.destination);
    accSource.connect(audioContext.destination);

    const duration = end - start;
    console.log(`▶️ Playing Segment ${index + 1} (From ${start}s to ${end}s)`);

    vocalSource.start(0, start, duration);
    accSource.start(0, start, duration);

    vocalSource.onended = () => {
      const nextIndex = currentSegmentIndex + 1;
      if (segments[nextIndex]) {
        loadAndPlaySegment(nextIndex);
      } else {
        console.log('✅ Reached final segment.');
        isPlaying = false;
      }
    };
  }

  async function loadSongResources(selectedName) {
    try {
      const accessToken = await getAccessToken();
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const suffixSafeName = selectedName.trim();
      const loopsPath = `lyrics/${suffixSafeName}_loops.json`;
      const [vocal, acc, loops] = await Promise.all([
        getDropboxAudioBuffer(`${suffixSafeName}_vocal.mp3`, accessToken),
        getDropboxAudioBuffer(`${suffixSafeName}_acc.mp3`, accessToken),
        fetch(loopsPath).then(res => res.json())
      ]);

      vocalBuffer = vocal;
      accBuffer = acc;
      segments = loops;
      console.log(`✅ Loaded ${segments.length} segments from`, loopsPath);
      renderSegmentButtons();

    } catch (error) {
      console.error('❌ Error loading song:', error);
    }
  }

  function renderSegmentButtons() {
    loopButtonsContainer.innerHTML = '';
    segments.forEach((seg, i) => {
      const btn = document.createElement('button');
      btn.textContent = `Segment ${i + 1}`;
      btn.style.backgroundColor = '#f9a825';
      btn.style.color = '#000';
      btn.style.border = 'none';
      btn.style.padding = '6px 10px';
      btn.style.margin = '3px';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        console.log(`🎯 User Clicked Segment ${i + 1}`);
        loadAndPlaySegment(i);
      });
      loopButtonsContainer.appendChild(btn);
    });
  }

  // Watch for song selection
  const songSelect = document.getElementById('songSelect');
  if (songSelect) {
    songSelect.addEventListener('change', () => {
      const selectedName = songSelect.value.trim();
      console.log('🎵 New song selected:', selectedName);
      loadSongResources(selectedName);
    });
  } else {
    console.warn('⚠️ songSelect not found');
  }
});
