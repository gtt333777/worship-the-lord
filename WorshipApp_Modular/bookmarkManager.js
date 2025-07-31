// === Bookmark Manager ===

let clipboardSong = null;

// Load bookmarks from localStorage
function loadBookmarks() {
  const stored = localStorage.getItem("bookmarkedFolders");
  return stored
    ? JSON.parse(stored)
    : {
        "Favorites 1": [],
        "Favorites 2": [],
        "Favorites 3": [],
        "Favorites 4": [],
        "Favorites 5": []
      };
}

// Save bookmarks to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedFolders", JSON.stringify(bookmarks));
}

// Toggle showing/hiding the folders inside the "📋 Bookmarked Songs" section
function showBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  container.style.display = container.style.display === "block" ? "none" : "block";

  const bookmarks = loadBookmarks();
  container.innerHTML = ""; // Clear old folders

  for (const folderName of Object.keys(bookmarks)) {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";

    const title = document.createElement("h3");
    title.textContent = folderName;
    folderDiv.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "song-list";
    ul.dataset.folder = folderName;
    ul.style.listStyleType = "none";
    ul.style.paddingLeft = "10px";

    bookmarks[folderName].forEach(songName => {
      const li = document.createElement("li");
      li.className = "song-entry";
      li.draggable = true;
      li.dataset.song = songName;

      li.innerHTML = `
        <span>${songName}</span>
        <span class="delete-icon" onclick="removeSongFromFolder('${folderName}', '${songName}')">🗑️</span>
      `;

      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("drop", handleDrop);

      ul.appendChild(li);
    });

    ul.addEventListener("contextmenu", e => {
      e.preventDefault();
      const folder = ul.dataset.folder;
      pasteSongToFolder(folder);
    });

    folderDiv.appendChild(ul);
    container.appendChild(folderDiv);
  }
}

// Remove song from a specific folder
function removeSongFromFolder(folder, songName) {
  const bookmarks = loadBookmarks();
  bookmarks[folder] = bookmarks[folder].filter(song => song !== songName);
  saveBookmarks(bookmarks);
  showBookmarkFolders(); // Refresh display
}

// === Drag and Drop for Reordering ===

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = e.currentTarget;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  const parent = target.parentNode;

  if (draggedItem !== target) {
    const draggedIndex = Array.from(parent.children).indexOf(draggedItem);
    const targetIndex = Array.from(parent.children).indexOf(target);

    parent.removeChild(draggedItem);
    if (draggedIndex < targetIndex) {
      parent.insertBefore(draggedItem, target.nextSibling);
    } else {
      parent.insertBefore(draggedItem, target);
    }

    // Save new order
    const folder = parent.dataset.folder;
    const reorderedSongs = Array.from(parent.children).map(li => li.dataset.song);
    const bookmarks = loadBookmarks();
    bookmarks[folder] = reorderedSongs;
    saveBookmarks(bookmarks);
  }
}

// === Right-click clipboard-style copy/paste ===

function copySongToClipboard() {
  const dropdown = document.getElementById("songSelect");
  clipboardSong = dropdown.value;
  alert(`📋 Copied: ${clipboardSong}`);
}

function pasteSongToFolder(folder) {
  if (!clipboardSong) {
    alert("⚠️ No song copied.");
    return;
  }

  const bookmarks = loadBookmarks();
  if (!bookmarks[folder].includes(clipboardSong)) {
    bookmarks[folder].push(clipboardSong);
    saveBookmarks(bookmarks);
    showBookmarkFolders(); // Refresh UI
    alert(`✅ Pasted "${clipboardSong}" to ${folder}`);
  } else {
    alert(`⚠️ "${clipboardSong}" already in ${folder}`);
  }
}

// === Initialize on Page Load ===

window.addEventListener("DOMContentLoaded", () => {
  showBookmarkFolders(); // Initial render
});
