let clipboardSong = null;
let draggedElement = null;

// 📂 Create folders Favorites 1 to 5
function renderBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  container.innerHTML = ""; // Clear old content

  for (let i = 1; i <= 5; i++) {
    const folder = document.createElement("div");
    folder.className = "folder";
    folder.dataset.folder = `Favorites ${i}`;

    const heading = document.createElement("h3");
    heading.textContent = `Favorites ${i}`;
    folder.appendChild(heading);

    const songList = document.createElement("div");
    songList.className = "song-list";
    songList.dataset.folder = `Favorites ${i}`;
    folder.appendChild(songList);

    folder.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (clipboardSong) {
        addSongToFolder(clipboardSong, folder.dataset.folder);
        clipboardSong = null;
      }
    });

    container.appendChild(folder);
  }

  loadBookmarks();
}

// 📋 Toggle visibility of bookmark folders
function showBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
    renderBookmarkFolders();
  } else {
    container.style.display = 'none';
  }
}

// 🎯 Add song to a specific folder
function addSongToFolder(songName, folderName) {
  const key = folderName.toLowerCase().replace(" ", "_");
  let songs = JSON.parse(localStorage.getItem(key) || "[]");
  if (!songs.includes(songName)) {
    songs.push(songName);
    localStorage.setItem(key, JSON.stringify(songs));
    renderBookmarkFolders();
  }
}

// 🗑️ Remove a song from a folder
function removeSongFromFolder(songName, folderName) {
  const key = folderName.toLowerCase().replace(" ", "_");
  let songs = JSON.parse(localStorage.getItem(key) || "[]");
  songs = songs.filter(name => name !== songName);
  localStorage.setItem(key, JSON.stringify(songs));
  renderBookmarkFolders();
}

// 📥 Load all saved bookmarks
function loadBookmarks() {
  for (let i = 1; i <= 5; i++) {
    const folderName = `Favorites ${i}`;
    const key = folderName.toLowerCase().replace(" ", "_");
    const songList = document.querySelector(`.song-list[data-folder='${folderName}']`);
    if (!songList) continue;

    let songs = JSON.parse(localStorage.getItem(key) || "[]");
    songs.forEach(songName => {
      const songDiv = document.createElement("div");
      songDiv.className = "bookmark-song";
      songDiv.textContent = songName;
      songDiv.draggable = true;

      // Drag Events
      songDiv.addEventListener("dragstart", (e) => {
        draggedElement = songDiv;
        e.dataTransfer.effectAllowed = "move";
      });

      songDiv.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      songDiv.addEventListener("drop", (e) => {
        e.preventDefault();
        const parent = songDiv.parentElement;
        if (draggedElement && draggedElement !== songDiv) {
          parent.insertBefore(draggedElement, songDiv.nextSibling);
          updateLocalStorageFromDOM(parent);
        }
      });

      // Touch Support (Mobile Reorder - basic)
      songDiv.addEventListener("touchstart", (e) => {
        draggedElement = songDiv;
      });

      songDiv.addEventListener("touchend", (e) => {
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains("bookmark-song") && target !== draggedElement) {
          const parent = target.parentElement;
          parent.insertBefore(draggedElement, target.nextSibling);
          updateLocalStorageFromDOM(parent);
        }
      });

      // 🗑️ Delete icon
      const del = document.createElement("span");
      del.innerHTML = "🗑️";
      del.style.float = "right";
      del.style.cursor = "pointer";
      del.onclick = () => removeSongFromFolder(songName, folderName);
      songDiv.appendChild(del);

      songList.appendChild(songDiv);
    });

    // Folder dragover + drop for cross-folder move
    songList.addEventListener("dragover", (e) => e.preventDefault());
    songList.addEventListener("drop", (e) => {
      e.preventDefault();
      if (draggedElement && songList !== draggedElement.parentElement) {
        songList.appendChild(draggedElement);
        updateLocalStorageFromDOM(draggedElement.parentElement); // from folder
        updateLocalStorageFromDOM(songList); // to folder
      }
    });
  }
}

// 💾 Update localStorage based on reordered DOM
function updateLocalStorageFromDOM(songListElement) {
  const folderName = songListElement.dataset.folder;
  const key = folderName.toLowerCase().replace(" ", "_");
  const newSongs = [];
  songListElement.querySelectorAll(".bookmark-song").forEach(div => {
    const name = div.childNodes[0].nodeValue.trim();
    if (name) newSongs.push(name);
  });
  localStorage.setItem(key, JSON.stringify(newSongs));
}
