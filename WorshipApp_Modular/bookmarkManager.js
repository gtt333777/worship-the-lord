// ✅ Toggle visibility of Bookmarked Songs folder
function showBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// ✅ Bookmark structure
const BOOKMARK_STORAGE_KEY = 'worshipBookmarks';

function loadBookmarks() {
  const data = localStorage.getItem(BOOKMARK_STORAGE_KEY);
  return data ? JSON.parse(data) : { 1: [], 2: [], 3: [], 4: [], 5: [] };
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
}

function copySongToClipboard() {
  const songName = document.getElementById("songSelect").value;
  navigator.clipboard.writeText(songName).then(() => {
    alert("✅ Copied to clipboard! Now right-click a folder to paste.");
  });
}

function renderBookmarks() {
  const container = document.getElementById("bookmarkFoldersView");
  const bookmarks = loadBookmarks();

  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";
    folderDiv.dataset.folder = i;

    const title = document.createElement("h3");
    title.innerText = `Favorites ${i}`;
    folderDiv.appendChild(title);

    // Right-click to paste
    folderDiv.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        if (!bookmarks[i].includes(text)) {
          bookmarks[i].push(text);
          saveBookmarks(bookmarks);
          renderBookmarks();
        }
      });
    });

    bookmarks[i].forEach((song, index) => {
      const songDiv = document.createElement("div");
      songDiv.className = "song-entry";
      songDiv.draggable = true;
      songDiv.dataset.index = index;
      songDiv.dataset.folder = i;
      songDiv.innerText = song;

      songDiv.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({
          fromFolder: i,
          fromIndex: index
        }));
      });

      songDiv.addEventListener("click", () => {
        const select = document.getElementById("songSelect");
        for (let opt of select.options) {
          if (opt.value === song) {
            select.value = song;
            select.dispatchEvent(new Event("change"));
            break;
          }
        }
      });

      const deleteIcon = document.createElement("span");
      deleteIcon.className = "delete-icon";
      deleteIcon.innerHTML = "🗑️";
      deleteIcon.onclick = () => {
        bookmarks[i].splice(index, 1);
        saveBookmarks(bookmarks);
        renderBookmarks();
      };

      songDiv.appendChild(deleteIcon);
      folderDiv.appendChild(songDiv);
    });

    folderDiv.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    folderDiv.addEventListener("drop", (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const song = bookmarks[data.fromFolder][data.fromIndex];

      if (!bookmarks[i].includes(song)) {
        bookmarks[i].push(song);
      }

      bookmarks[data.fromFolder].splice(data.fromIndex, 1);
      saveBookmarks(bookmarks);
      renderBookmarks();
    });

    container.appendChild(folderDiv);
  }
}

// ✅ Load bookmarks on page ready
document.addEventListener("DOMContentLoaded", renderBookmarks);
