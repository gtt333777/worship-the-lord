// === Bookmark Manager ===

let copiedSong = null;

// Load bookmarks from localStorage
function loadBookmarks() {
  const data = localStorage.getItem("bookmarks");
  return data ? JSON.parse(data) : { "1": [], "2": [], "3": [], "4": [], "5": [] };
}

// Save bookmarks to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

// Add to a specific folder
function addToFavorites(folderNumber, songName) {
  const bookmarks = loadBookmarks();
  if (!bookmarks[folderNumber].includes(songName)) {
    bookmarks[folderNumber].push(songName);
    saveBookmarks(bookmarks);
    renderBookmarkFolders();
  }
}

// Remove from folder
function removeFromFavorites(folderNumber, songName) {
  const bookmarks = loadBookmarks();
  bookmarks[folderNumber] = bookmarks[folderNumber].filter((s) => s !== songName);
  saveBookmarks(bookmarks);
  renderBookmarkFolders();
}

// Drag and Drop handler
function handleDrop(e, folderNumber) {
  e.preventDefault();
  const songName = e.dataTransfer.getData("text/plain");
  addToFavorites(folderNumber, songName);
}

function handleDragStart(e, songName) {
  e.dataTransfer.setData("text/plain", songName);
}

// Render folders and songs
function renderBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  const bookmarks = loadBookmarks();
  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";
    folderDiv.innerHTML = `<h3>Favorites ${i}</h3>`;
    folderDiv.ondragover = (e) => e.preventDefault();
    folderDiv.ondrop = (e) => handleDrop(e, i.toString());

    bookmarks[i].forEach((song) => {
      const songDiv = document.createElement("div");
      songDiv.className = "song-entry";
      songDiv.setAttribute("draggable", true);
      songDiv.ondragstart = (e) => handleDragStart(e, song);

      const text = document.createElement("span");
      text.textContent = song;

      const del = document.createElement("span");
      del.className = "delete-icon";
      del.textContent = "❌";
      del.onclick = () => removeFromFavorites(i.toString(), song);

      songDiv.appendChild(text);
      songDiv.appendChild(del);
      folderDiv.appendChild(songDiv);
    });

    container.appendChild(folderDiv);
  }
}

// Show/hide the entire folder panel
function showBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  if (container.style.display === 'none') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// 📋 Right-click copy + paste into folder
function copySongToClipboard() {
  const select = document.getElementById("songSelect");
  const selectedIndex = select.selectedIndex;
  if (selectedIndex < 0) return;
  copiedSong = select.options[selectedIndex].textContent;
  alert(`📋 Copied: ${copiedSong}`);
}

// Used when clicking on folder
function pasteSongToFolder(folderNumber) {
  if (!copiedSong) {
    alert("⚠️ No song copied.");
    return;
  }
  addToFavorites(folderNumber, copiedSong);
  copiedSong = null;
}

// 🔄 Render full song list + right-click bookmark behavior
function renderSongListWithBookmarks(songNames) {
  const select = document.getElementById("songSelect");
  select.innerHTML = "";
  songNames.forEach((name, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = name;
    select.appendChild(option);
  });

  // 🔖 Right-click to bookmark
  select.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const selectedIndex = select.selectedIndex;
    if (selectedIndex < 0) return;
    const songName = songNames[selectedIndex];
    const confirmFolder = prompt("Add to which Favorites? (1–5):");
    if (["1", "2", "3", "4", "5"].includes(confirmFolder)) {
      addToFavorites(confirmFolder, songName);
      showBookmarkFolders(); // Refresh
    }
  });
}
