// ✅ FINAL VERSION of bookmarkManager.js
// ✅ No per-folder collapse — all folders always shown together
// ✅ Includes: drag & drop, delete, global-safe for Netlify

let bookmarks = {}; // Global
let currentFolder = "Favorites 1";

function loadBookmarks() {
  const saved = localStorage.getItem("bookmarkedSongs");
  if (saved) bookmarks = JSON.parse(saved);
  else bookmarks = {};
  for (let i = 1; i <= 5; i++) {
    if (!bookmarks[`Favorites ${i}`]) bookmarks[`Favorites ${i}`] = [];
  }
  console.log("✅ Bookmark folders loaded");
}

function saveBookmarks() {
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
}

function setCurrentFolder(folder) {
  currentFolder = folder;
  console.log("📁 Current folder set to:", folder);
}

function bookmarkCurrentSong() {
  const select = document.getElementById("songSelect");
  const song = select.value.trim();
  if (!bookmarks[currentFolder].includes(song)) {
    bookmarks[currentFolder].push(song);
    saveBookmarks();
    console.log(`✅ '${song}' bookmarked to ${currentFolder}`);
    renderBookmarkFolders();
  }
}

function deleteBookmarkedSong(folder, song) {
  const index = bookmarks[folder].indexOf(song);
  if (index !== -1) {
    bookmarks[folder].splice(index, 1);
    saveBookmarks();
    renderBookmarkFolders();
  }
}

function showBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  if (!container) {
    console.warn("❌ bookmarkedContainer not found");
    return;
  }
  container.style.display = "block";
  renderBookmarkFolders();
}

function renderBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const folderName = `Favorites ${i}`;
    const wrapper = document.createElement("div");
    wrapper.className = "bookmark-folder";

    const header = document.createElement("div");
    header.className = "bookmark-header";
    header.innerHTML = `<span>${folderName}</span>`;
    wrapper.appendChild(header);

    const list = document.createElement("div");
    list.className = "bookmark-list";
    list.dataset.folder = folderName;

    bookmarks[folderName].forEach((song) => {
      const songDiv = document.createElement("div");
      songDiv.className = "bookmark-song";
      songDiv.draggable = true;
      songDiv.innerHTML = `
        <span class="song-title" onclick="playBookmarkedSong('${song}')">${song}</span>
        <button class="delete-btn" onclick="deleteBookmarkedSong('${folderName}', '${song}')">🗑️</button>
      `;

      songDiv.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ song, from: folderName }));
      };

      list.ondragover = (e) => e.preventDefault();
      list.ondrop = (e) => {
        e.preventDefault();
        const { song, from } = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (from !== folderName) {
          deleteBookmarkedSong(from, song);
          bookmarks[folderName].push(song);
          saveBookmarks();
          renderBookmarkFolders();
        }
      };

      list.appendChild(songDiv);
    });

    wrapper.appendChild(list);
    container.appendChild(wrapper);
  }
}

function playBookmarkedSong(songName) {
  const songSelect = document.getElementById("songSelect");
  if (!songSelect) return;
  songSelect.value = songName;
  songSelect.dispatchEvent(new Event("change"));
  console.log("▶️ Playing bookmarked song:", songName);
}



let foldersCollapsed = false;

function toggleFolders() {
  const lists = document.querySelectorAll('.bookmark-list');
  lists.forEach(list => {
    list.style.display = foldersCollapsed ? 'block' : 'none';
  });

  const toggleBtn = document.getElementById('toggleFoldersBtn');
  if (toggleBtn) {
    toggleBtn.textContent = foldersCollapsed ? '➖ Collapse Folders' : '➕ Expand Folders';
  }

  foldersCollapsed = !foldersCollapsed;
}

let foldersVisible = true;

function toggleFolders() {
  const container = document.getElementById("bookmarkedContainer");
  if (!container) return;

  foldersVisible = !foldersVisible;
  container.style.display = foldersVisible ? "block" : "none";

  const btn = document.getElementById("toggleFoldersBtn");
  if (btn) {
    btn.textContent = foldersVisible ? "Collapse Folders" : "Expand Folders";
  }
}
