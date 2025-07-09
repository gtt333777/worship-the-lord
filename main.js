// Simple "lyrics library" keyed by song title prefix.
// Add more songs as needed.
const lyricsLibrary = {
  "என்னை காண்பவரே": `என்னை காண்பவரே தினம் காப்பவரே (2)

1. ஆராய்ந்து அறிந்திருக்கின்றீர்
சுற்றி சுற்றி சூழ்ந்திக்கின்றீர் (2)
நான் அமர்வதும் நான் எழுவதும் (2)
நன்றாய் நீர் அறிந்திக்கின்றீர் (2)  – என்னை

2. எண்ணங்கள் ஏக்கங்கள் எல்லாம்
எல்லாமே அறிந்திக்கின்றீர் (2)
நடந்தாலும் படுத்தாலும்
அப்பா நீர் அறிந்திக்கின்றீர் (2)
நன்றி ராஜா இயேசு ராஜா (2)    – என்னை

3. முன்னும் பின்னும் நெருக்கி நெருக்கி
சுற்றி என்னை சூழ்ந்திக்கின்றீர் (2)
உம் திரு கரத்தால் தினமும்
என்னை பற்றி பிடித்திருக்கின்டீர்
நன்றி ராஜா இயேசு ராஜா (2) – என்னை

4. கருவை உம் கண்கள் கண்டன
மறைவாய் வளர்வதை கவனித்தீரே – என்
அதிசயமாய் பிரமிக்கத்தக்க
பக்குவமாய் உருவாக்கினீர்
நன்றி ராஜா இயேசு ராஜா (2) – என்னை`,

  "ஐயா உம் திரு நாமம்": 
  `ஐயா உம் திருநாமம்
அகிலமெல்லாம் பரவ வேண்டும்
ஆறுதல் உம் வசனம்
அனைவரும் கேட்க வேண்டும்

கலங்கிடும் மாந்தர்
கல்வாரி அன்பை
கண்டு மகிழ வேண்டும்
கழுவப்பட்டு வாழ வேண்டும்

இருளில் வாழும் மாந்தர்
பேரொளியைக் கண்டு
இரட்சிப்பு அடைய வேண்டும்
இயேசு என்று சொல்ல வேண்டும்

சாத்தானை வென்று
சாபத்தினின்று
விடுதலை பெற வேண்டும்
வெற்றி பெற்று வாழ வேண்டும்

குருடரெல்லாம் பார்க்கணும்
முடவரெல்லாம் நடக்கணுமே
செவிடரெல்லாம் கேட்கணுமே
சுவிஷேசம் சொல்லணுமே
`
};

// For storing loaded audio buffers and sources
let vocalsBuffer, accompBuffer;
let vocalsSource, accompSource;
let audioCtx = null;
let vocalsGain, accompGain;

// Lyrics state
let currentLyricsKey = null;

function loadSong() {
  const vocalsInput = document.getElementById('vocalsFile');
  const accompInput = document.getElementById('accompFile');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  if (!vocalsInput.files.length || !accompInput.files.length) {
    alert('Please select both vocals and accompaniment WAV files.');
    return;
  }
  const vocalsFile = vocalsInput.files[0];
  const accompFile = accompInput.files[0];

  // Get song title by filename prefix (strip extension, use up to first " - " or first ".wav")
  const vocalsTitle = getFilePrefix(vocalsFile.name);
  const accompTitle = getFilePrefix(accompFile.name);

  if (vocalsTitle !== accompTitle) {
    alert('File name prefixes do not match. Please select files with the same song prefix.');
    return;
  }

  // Set lyrics if available
  if (lyricsLibrary[vocalsTitle]) {
    document.getElementById('lyricsTitle').textContent = vocalsTitle;
    document.getElementById('lyricsDisplay').textContent = lyricsLibrary[vocalsTitle];
    currentLyricsKey = vocalsTitle;
  } else {
    document.getElementById('lyricsTitle').textContent = '';
    document.getElementById('lyricsDisplay').textContent = 'No lyrics found for this song.';
    currentLyricsKey = null;
  }

  // Load and prepare audio
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  Promise.all([
    readFileAsArrayBuffer(vocalsFile),
    readFileAsArrayBuffer(accompFile)
  ]).then(([vocalsData, accompData]) => {
    audioCtx.decodeAudioData(vocalsData, (buf) => { vocalsBuffer = buf; }, (e)=>{alert("Cannot decode vocals")});
    audioCtx.decodeAudioData(accompData, (buf) => { accompBuffer = buf; }, (e)=>{alert("Cannot decode accomp")});
    playBtn.disabled = false;
    pauseBtn.disabled = false;
    stopSong(); // ensure stopped
  });
}

function getFilePrefix(filename) {
  return filename.replace(/\.(wav|mp3)$/i, '').trim();
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function playSong() {
  if (!vocalsBuffer || !accompBuffer) return;

  stopSong(); // If playing already

  vocalsSource = audioCtx.createBufferSource();
  vocalsSource.buffer = vocalsBuffer;
  vocalsGain = audioCtx.createGain();
  vocalsGain.gain.value = document.getElementById('vocalsVolume').value;
  vocalsSource.connect(vocalsGain).connect(audioCtx.destination);

  accompSource = audioCtx.createBufferSource();
  accompSource.buffer = accompBuffer;
  accompGain = audioCtx.createGain();
  accompGain.gain.value = document.getElementById('accompVolume').value;
  accompSource.connect(accompGain).connect(audioCtx.destination);

  vocalsSource.start(0);
  accompSource.start(0);
}

function pauseSong() {
  if (audioCtx) audioCtx.suspend();
}

function stopSong() {
  try {
    if (vocalsSource) vocalsSource.stop();
    if (accompSource) accompSource.stop();
  } catch(e){}
  vocalsSource = null;
  accompSource = null;
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

// Volume control handlers
document.getElementById('vocalsVolume').addEventListener('input', function(e){
  if (vocalsGain) vocalsGain.gain.value = e.target.value;
});
document.getElementById('accompVolume').addEventListener('input', function(e){
  if (accompGain) accompGain.gain.value = e.target.value;
});

// ----- Message Board -----
window.postMessage = function() {
  const msg = document.getElementById('messageInput').value.trim();
  if (msg) {
    let area = document.getElementById('messagesArea');
    let p = document.createElement('p');
    p.textContent = msg;
    area.appendChild(p);
    document.getElementById('messageInput').value = '';
  }
};

