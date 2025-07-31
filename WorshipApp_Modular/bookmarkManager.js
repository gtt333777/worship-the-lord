// === Bookmark Manager ===

// Globals
let copiedSong = null;

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

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarkedFolders", JSON.stringify(bookmarks));
}

// 🧩 Show expanded folders
function showBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  container.innerHTML = ""; // Clear existing

  const bookmarks = loadBookmarks();

  Object.keys(bookmarks).forEach(folder => {
    const folderDiv = document.createElement("div");
    folderDiv.style.margin = "10px 0";
    folderDiv.style.border = "1px solid #ccc";
    folderDiv.style.padding = "10px";
    folderDiv.style.background = "#f9f9f9";

    const title = document.createElement("h4");
    title.textContent = folder;
    folderDiv.appendChild(title);

    // Allow paste on right-click
    folderDiv.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (copiedSong && !bookmarks[folder].includes(copiedSong)) {
        bookmarks[folder].push(copiedSong);
        saveBookmarks(bookmarks);
        showBookmarkFolders();
      }
    });

    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.paddingLeft = "10px";

    bookmarks[folder].forEach((song, index) => {
      const li = document.createElement("li");
      li.style.marginBottom = "6px";

      const text = document.createElement("span");
      text.textContent = song;
      text.style.marginRight = "10px";

      // Delete icon
      const del = document.createElement("span");
      del.textContent = "🗑️";
      del.style.cursor = "pointer";
      del.title = "Remove from this folder";
      del.addEventListener("click", () => {
        bookmarks[folder].splice(index, 1);
        saveBookmarks(bookmarks);
        showBookmarkFolders();
      });

      li.appendChild(text);
      li.appendChild(del);
      ul.appendChild(li);
    });

    folderDiv.appendChild(ul);
    container.appendChild(folderDiv);
  });
}

// 📋 Copy selected song
function copySongToClipboard() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  copiedSong = selectedSong;
  alert(`Copied: "${copiedSong}". Right-click on any folder to paste.`);
}

// Load folders on page load
window.addEventListener("DOMContentLoaded", () => {
  showBookmarkFolders();
});
