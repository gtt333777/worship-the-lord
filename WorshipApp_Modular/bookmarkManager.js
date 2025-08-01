let bookmarkData = {
  "Favorites 1": [],
  "Favorites 2": [],
  "Favorites 3": [],
  "Favorites 4": [],
  "Favorites 5": []
};

let currentFolder = "Favorites 1";

function setCurrentFolder(folderName) {
  currentFolder = folderName;
}

function bookmarkCurrentSong() {
  const song = document.getElementById("songSelect").value.trim();
  if (song && !bookmarkData[currentFolder].includes(song)) {
    bookmarkData[currentFolder].push(song);
    saveBookmarks();
    renderBookmarkFolders();
  }
}

function saveBookmarks() {
  localStorage.setItem("worshipBookmarks", JSON.stringify(bookmarkData));
}

function loadBookmarks() {
  const stored = localStorage.getItem("worshipBookmarks");
  if (stored) {
    bookmarkData = JSON.parse(stored);
  }
}

function renderBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const folderName = `Favorites ${i}`;
    const wrapper = document.createElement("div");
    wrapper.className = "folder";

    const header = document.createElement("h3");
    header.textContent = folderName;
    header.style.cursor = "pointer";

    const songList = document.createElement("div");
    songList.style.display = "none";
    songList.dataset.folder = folderName;

    bookmarkData[folderName].forEach((song, index) => {
      const row = document.createElement("div");
      row.className = "song-entry";
      row.draggable = true;
      row.dataset.index = index;
      row.dataset.folder = folderName;
      row.textContent = song;

      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = "❌";
      deleteBtn.className = "delete-icon";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        bookmarkData[folderName].splice(index, 1);
        saveBookmarks();
        renderBookmarkFolders();
      };

      row.onclick = () => {
        document.getElementById("songSelect").value = song;
        loadLyricsForSelectedSong(document.getElementById("songSelect"));
      };

      row.appendChild(deleteBtn);
      songList.appendChild(row);
    });

    // Collapsing toggle
    header.onclick = () => {
      songList.style.display = songList.style.display === "none" ? "block" : "none";
    };

    // Drag + drop within folder
    songList.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", e.target.dataset.index);
      e.dataTransfer.setData("folder", e.target.dataset.folder);
    };

    songList.ondragover = (e) => e.preventDefault();

    songList.ondrop = (e) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const folder = e.dataTransfer.getData("folder");
      const target = e.target.closest(".song-entry");

      if (!target || folder !== target.dataset.folder) return;

      const targetIndex = parseInt(target.dataset.index);
      const list = bookmarkData[folder];
      const [moved] = list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, moved);

      saveBookmarks();
      renderBookmarkFolders();
    };

    wrapper.appendChild(header);
    wrapper.appendChild(songList);
    container.appendChild(wrapper);
  }
  console.log("✅ Bookmark folders rendered.");
}

function showBookmarkFolders() {
  loadBookmarks();
  renderBookmarkFolders();
  document.getElementById("bookmarkedContainer").style.display = "block";
  console.log("📂 Bookmarked Songs opened.");
}
