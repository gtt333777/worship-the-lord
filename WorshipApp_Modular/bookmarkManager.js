// ✅ Persistent Storage
const FAVORITE_FOLDERS = ['Favorites 1', 'Favorites 2', 'Favorites 3', 'Favorites 4', 'Favorites 5'];
let clipboardSong = null;

function loadBookmarks() {
  const container = document.getElementById('bookmarkedContainer');
  container.innerHTML = '';
  FAVORITE_FOLDERS.forEach(folder => {
    const songs = JSON.parse(localStorage.getItem(folder) || '[]');
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder';
    folderDiv.innerHTML = `<h3>${folder}</h3>`;
    songs.forEach((song, i) => {
      const songDiv = document.createElement('div');
      songDiv.className = 'song-entry';
      songDiv.draggable = true;
      songDiv.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ song, fromFolder: folder, index: i }));
      songDiv.innerHTML = `
        <span>${song}</span>
        <span class="delete-icon" onclick="removeBookmark('${folder}', ${i})">🗑️</span>
      `;
      folderDiv.appendChild(songDiv);
    });

    folderDiv.ondragover = e => e.preventDefault();
    folderDiv.ondrop = e => {
      e.preventDefault();
      const { song, fromFolder, index } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (folder === fromFolder) return; // Skip if dropped in same folder

      let fromList = JSON.parse(localStorage.getItem(fromFolder) || '[]');
      fromList.splice(index, 1);
      localStorage.setItem(fromFolder, JSON.stringify(fromList));

      let toList = JSON.parse(localStorage.getItem(folder) || '[]');
      toList.push(song);
      localStorage.setItem(folder, JSON.stringify(toList));
      loadBookmarks();
    };

    container.appendChild(folderDiv);
  });
}

function showBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  container.style.display = (container.style.display === 'none') ? 'block' : 'none';
  loadBookmarks();
}

function removeBookmark(folder, index) {
  let list = JSON.parse(localStorage.getItem(folder) || '[]');
  list.splice(index, 1);
  localStorage.setItem(folder, JSON.stringify(list));
  loadBookmarks();
}

function createBookmarkButton(songName) {
  const btn = document.createElement('button');
  btn.textContent = '🔖';
  btn.onclick = () => showBookmarkDropdown(songName);
  return btn;
}

function showBookmarkDropdown(songName) {
  const existing = document.getElementById('bookmarkDropdown');
  if (existing) existing.remove();

  const dropdown = document.createElement('div');
  dropdown.id = 'bookmarkDropdown';
  dropdown.style.position = 'fixed';
  dropdown.style.top = '40%';
  dropdown.style.left = '50%';
  dropdown.style.transform = 'translate(-50%, -50%)';
  dropdown.style.background = '#fff';
  dropdown.style.padding = '10px';
  dropdown.style.border = '1px solid #ccc';
  dropdown.style.borderRadius = '6px';
  dropdown.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
  dropdown.innerHTML = `<strong>📂 Choose Folder</strong><br/><br/>`;

  const select = document.createElement('select');
  FAVORITE_FOLDERS.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder;
    option.textContent = folder;
    select.appendChild(option);
  });
  dropdown.appendChild(select);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '✅ Save';
  saveBtn.style.marginLeft = '10px';
  saveBtn.onclick = () => {
    const folder = select.value;
    const list = JSON.parse(localStorage.getItem(folder) || '[]');
    if (!list.includes(songName)) {
      list.push(songName);
      localStorage.setItem(folder, JSON.stringify(list));
    }
    dropdown.remove();
    loadBookmarks();
  };
  dropdown.appendChild(saveBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '❌ Cancel';
  cancelBtn.style.marginLeft = '10px';
  cancelBtn.onclick = () => dropdown.remove();
  dropdown.appendChild(cancelBtn);

  document.body.appendChild(dropdown);
}

// ✅ Song list integration
function renderSongListWithBookmarks(songNames) {
  const select = document.getElementById('songSelect');
  select.innerHTML = '';
  songNames.forEach(name => {
    const option = document.createElement('option');
    option.textContent = name;
    option.value = name;
    select.appendChild(option);
  });

  // Add 🔖 buttons next to each song in dropdown
  const container = document.getElementById('songSelect').parentElement;
  const labels = container.querySelectorAll('label');
  if (!document.getElementById('bookmarkButtonsInserted')) {
    const wrap = document.createElement('div');
    wrap.id = 'bookmarkButtonsInserted';
    songNames.forEach(name => {
      const row = document.createElement('div');
      row.style.margin = '5px';
      row.textContent = name + ' ';
      row.appendChild(createBookmarkButton(name));
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  }
}
