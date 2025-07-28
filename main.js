// === Audio Elements ===
const vocalAudio = new Audio();
const accompAudio = new Audio();
let currentSong = '';
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');

// === DOM Elements ===
const songSelect = document.getElementById('songSelect');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const vocalVolumeSlider = document.getElementById('vocalVolume');
const accompVolumeSlider = document.getElementById('accompVolume');
const lyricsBox = document.getElementById('lyricsBox');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarkDropdown = document.getElementById('bookmarkDropdown');

// === Load Songs ===
fetch('lyrics/songs_names.txt')
  .then(res => res.text())
  .then(text => {
    const songs = text.split('\n').map(line => line.trim()).filter(Boolean);
    songs.forEach(song => {
      const option = document.createElement('option');
      option.value = song;
      option.textContent = song;
      songSelect.appendChild(option);
    });
  });

// === Load Song ===
songSelect.addEventListener('change', () => {
  const songName = songSelect.value;
  currentSong = songName;
  loadLyrics(songName);
  loadAudio(songName);
  updateBookmarkStar();
});

// === Load Lyrics ===
function loadLyrics(songName) {
  fetch(`lyrics/${songName}.txt`)
    .then(res => res.text())
    .then(text => {
      lyricsBox.value = text;
    });
}

// === Load Audio ===
function loadAudio(songName) {
  const base = `https://worship-the-lord.netlify.app/.netlify/functions/proxy?path=%2FWorshipSongs%2F${encodeURIComponent(songName)}`;
  vocalAudio.src = `${base}_vocal.wav`;
  accompAudio.src = `${base}_acc.wav`;
}

// === Playback Control ===
playBtn.addEventListener('click', () => {
  vocalAudio.play();
  accompAudio.play();
});

pauseBtn.addEventListener('click', () => {
  vocalAudio.pause();
  accompAudio.pause();
});

// === Volume Control ===
function adjustVolume(type, delta) {
  const audio = type === 'vocal' ? vocalAudio : accompAudio;
  const slider = type === 'vocal' ? vocalVolumeSlider : accompVolumeSlider;
  let newVolume = Math.min(1, Math.max(0, audio.volume + delta));
  audio.volume = newVolume;
  slider.value = newVolume;
}

vocalVolumeSlider.addEventListener('input', () => {
  vocalAudio.volume = vocalVolumeSlider.value;
});

accompVolumeSlider.addEventListener('input', () => {
  accompAudio.volume = accompVolumeSlider.value;
});

// === Skip Seconds ===
function skipSeconds(seconds) {
  vocalAudio.currentTime += seconds;
  accompAudio.currentTime += seconds;
}

// === Bookmark Logic ===
bookmarkBtn.addEventListener('click', () => {
  if (!currentSong) return;

  let category = prompt("Choose Favorites number (1-5):", "1");
  if (!category || isNaN(category) || category < 1 || category > 5) return;

  const folder = `Favorites ${category}`;

  if (!bookmarks[folder]) {
    bookmarks[folder] = [];
  }

  // Toggle Bookmark
  const idx = bookmarks[folder].indexOf(currentSong);
  if (idx === -1) {
    // Add
    bookmarks[folder].push(currentSong);
  } else {
    // Remove
    bookmarks[folder].splice(idx, 1);
    // Clean up empty folders
    if (bookmarks[folder].length === 0) {
      delete bookmarks[folder];
    }
  }

  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  updateBookmarkDropdown();
  updateBookmarkStar();
});

function updateBookmarkStar() {
  let isBookmarked = false;
  for (const folder in bookmarks) {
    if (Array.isArray(bookmarks[folder]) && bookmarks[folder].includes(currentSong)) {
      isBookmarked = true;
      break;
    }
  }
  bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
}

function updateBookmarkDropdown() {
  bookmarkDropdown.innerHTML = '<option value="">🎯 Bookmarked Songs</option>';
  const sortedKeys = Object.keys(bookmarks)
    .filter(key => /^Favorites [1-5]$/.test(key))
    .sort((a, b) => {
      const numA = parseInt(a.split(' ')[1]);
      const numB = parseInt(b.split(' ')[1]);
      return numA - numB;
    });

  sortedKeys.forEach(folder => {
    const optGroup = document.createElement('optgroup');
    optGroup.label = folder;

    bookmarks[folder].forEach(song => {
      const option = document.createElement('option');
      option.value = song;
      option.textContent = song;
      optGroup.appendChild(option);
    });

    bookmarkDropdown.appendChild(optGroup);
  });
}

// === Load from Dropdown ===
bookmarkDropdown.addEventListener('change', () => {
  if (bookmarkDropdown.value) {
    songSelect.value = bookmarkDropdown.value;
    songSelect.dispatchEvent(new Event('change'));
  }
});

// === Initialize ===
updateBookmarkDropdown();
