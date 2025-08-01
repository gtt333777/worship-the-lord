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
  } else {
    container.style.display = 'none';
  }
}

// 🧠 Save to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
}

// 🧠 Load from localStorage
function loadBookmarks() {
  const data = localStorage.getItem("bookmarkedSongs");
  if (!data) return;

  const bookmarks = JSON.parse(data);
  for (const folder in bookmarks) {
    const songList = document.querySelector(`.song-list[data-folder="${folder}"]`);
    if (songList) {
      bookmarks[folder].forEach(song => {
        const div = document.createElement("div");
        div.className = "bookmarkedSong";
        div.textContent = song;
        div.setAttribute("draggable", "true");

        // 🎵 AUTOPLAY ON CLICK
        div.addEventListener("click", () => {
          const dropdown = document.getElementById("songDropdown");
          dropdown.value = song;
          dropdown.dispatchEvent(new Event("change")); // triggers lyrics/audio
          setTimeout(() => playBoth(), 300); // slight delay to allow load
        });

        // 🗑 Add trash icon
        const trash = document.createElement("span");
        trash.className = "trash";
        trash.innerHTML = "🗑";
        trash.addEventListener("click", (e) => {
          e.stopPropagation();
          removeSongFromFolder(song, folder);
        });
        div.appendChild(trash);

        // 🖱 Drag handling
        div.addEventListener("dragstart", (e) => {
          draggedElement = { song, from: folder };
        });
        div.addEventListener("dragover", (e) => e.preventDefault());
        div.addEventListener("drop", (e) => {
          e.preventDefault();
          if (draggedElement && draggedElement.song !== song) {
            moveSong(draggedElement.song, draggedElement.from, folder);
            draggedElement = null;
          }
        });

        songList.appendChild(div);
      });
    }
  }
}

// 📥 Add song to folder
function addSongToFolder(song, folder) {
  const data = localStorage.getItem("bookmarkedSongs");
  const bookmarks = data ? JSON.parse(data) : {};

  if (!bookmarks[folder]) bookmarks[folder] = [];

  if (!bookmarks[folder].includes(song)) {
    bookmarks[folder].push(song);
    saveBookmarks(bookmarks);
    renderBookmarkFolders();
    alert(`⭐ ${song} added to ${folder}`);
  }
}

// 🧹 Remove song from folder
function removeSongFromFolder(song, folder) {
  const data = localStorage.getItem("bookmarkedSongs");
  const bookmarks = data ? JSON.parse(data) : {};

  if (bookmarks[folder]) {
    bookmarks[folder] = bookmarks[folder].filter(s => s !== song);
    saveBookmarks(bookmarks);
    renderBookmarkFolders();
  }
}

// 🔄 Move song between folders
function moveSong(song, fromFolder, toFolder) {
  if (fromFolder === toFolder) return;

  const data = localStorage.getItem("bookmarkedSongs");
  const bookmarks = data ? JSON.parse(data) : {};

  if (!bookmarks[toFolder]) bookmarks[toFolder] = [];

  // Remove from old
  bookmarks[fromFolder] = bookmarks[fromFolder].filter(s => s !== song);
  // Add to new
  if (!bookmarks[toFolder].includes(song)) {
    bookmarks[toFolder].push(song);
  }

  saveBookmarks(bookmarks);
  renderBookmarkFolders();
}
