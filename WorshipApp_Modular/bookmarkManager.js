let clipboardSong = null;

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

// ⭐ Add currently selected song to a folder
function bookmarkCurrentSong() {
  const selectedSong = document.getElementById("songSelect").value;
  if (!selectedSong) return;

  const folder = prompt("Choose folder (1–5) to bookmark this song:");
  if (!folder || isNaN(folder) || folder < 1 || folder > 5) return;

  addSongToFolder(selectedSong, `Favorites ${folder}`);
}

// ➕ Add song entry into folder DOM and save
function addSongToFolder(songName, folderName) {
  const key = `bookmark_${folderName}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");

  if (!existing.includes(songName)) {
    existing.push(songName);
    localStorage.setItem(key, JSON.stringify(existing));
    renderBookmarkFolders(); // Re-render to update UI
  }
}

// 🗑️ Remove song from folder
function deleteSongFromFolder(songName, folderName) {
  const key = `bookmark_${folderName}`;
  let songs = JSON.parse(localStorage.getItem(key) || "[]");
  songs = songs.filter(name => name !== songName);
  localStorage.setItem(key, JSON.stringify(songs));
  renderBookmarkFolders();
}

// ⬇️ Load bookmarks from localStorage into folders
function loadBookmarks() {
  const folders = document.querySelectorAll(".folder");

  folders.forEach(folder => {
    const folderName = folder.dataset.folder;
    const key = `bookmark_${folderName}`;
    const songs = JSON.parse(localStorage.getItem(key) || "[]");

    const songList = folder.querySelector(".song-list");
    songList.innerHTML = "";

    songs.forEach(song => {
      const entry = document.createElement("div");
      entry.className = "song-entry";
      entry.textContent = song;

      const deleteIcon = document.createElement("span");
      deleteIcon.className = "delete-icon";
      deleteIcon.textContent = "🗑️";
      deleteIcon.onclick = () => deleteSongFromFolder(song, folderName);

      entry.appendChild(deleteIcon);
      songList.appendChild(entry);

      // Make draggable
      entry.draggable = true;
      entry.ondragstart = e => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ song, from: folderName }));
      };
    });

    // Allow drop into folders
    folder.ondragover = e => e.preventDefault();
    folder.ondrop = e => {
      e.preventDefault();
      const { song, from } = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (from !== folderName) {
        deleteSongFromFolder(song, from);
        addSongToFolder(song, folderName);
      }
    };
  });
}

// 📋 Right-click song from dropdown
document.getElementById("songSelect").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const selected = e.target.value;
  if (selected) {
    clipboardSong = selected;
    alert(`✅ '${selected}' copied. Now right-click on Favorites folder to paste.`);
  }
});

// ⭐ Optional: show bookmarkThisBtn dynamically
document.getElementById("songSelect").addEventListener("change", () => {
  const btn = document.getElementById("bookmarkThisBtn");
  if (document.getElementById("songSelect").value) {
    btn.style.display = "inline-block";
  } else {
    btn.style.display = "none";
  }
});

document.getElementById("bookmarkThisBtn").addEventListener("click", bookmarkCurrentSong);
