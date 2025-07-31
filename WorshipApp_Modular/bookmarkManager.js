// === Globals ===
let copiedSong = null;
let longPressTimer = null;

// === Toggle Favorites Display ===
function showBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// === Add Song to Folder ===
function addToFolder(folderNumber, songName) {
  const key = `favorites_${folderNumber}`;
  const songs = JSON.parse(localStorage.getItem(key) || '[]');
  if (!songs.includes(songName)) {
    songs.push(songName);
    localStorage.setItem(key, JSON.stringify(songs));
    renderFavorites();
  }
}

// === Render All Favorite Folders ===
function renderFavorites() {
  const container = document.getElementById("bookmarkFoldersView");
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const songs = JSON.parse(localStorage.getItem(`favorites_${i}`) || "[]");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<h3>Favorites ${i}</h3>`;
    songs.forEach((song, index) => {
      const item = document.createElement("div");
      item.textContent = song;
      item.style.padding = "4px";
      item.style.border = "1px solid #ccc";
      item.style.margin = "4px";
      item.style.cursor = "move";
      item.setAttribute("draggable", "true");

      item.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ song, from: i }));
      };

      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = "🗑️";
      deleteBtn.style.float = "right";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.onclick = () => {
        songs.splice(index, 1);
        localStorage.setItem(`favorites_${i}`, JSON.stringify(songs));
        renderFavorites();
      };

      item.appendChild(deleteBtn);
      wrapper.appendChild(item);
    });

    wrapper.ondragover = (e) => e.preventDefault();
    wrapper.ondrop = (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.from !== i) {
        const fromSongs = JSON.parse(localStorage.getItem(`favorites_${data.from}`) || "[]");
        const toSongs = JSON.parse(localStorage.getItem(`favorites_${i}`) || "[]");
        if (!toSongs.includes(data.song)) {
          toSongs.push(data.song);
          localStorage.setItem(`favorites_${i}`, JSON.stringify(toSongs));
        }
        const index = fromSongs.indexOf(data.song);
        if (index !== -1) {
          fromSongs.splice(index, 1);
          localStorage.setItem(`favorites_${data.from}`, JSON.stringify(fromSongs));
        }
        renderFavorites();
      }
    };

    container.appendChild(wrapper);
  }
}

// === Show Folder Choice Dialog ===
function showFolderChoice(songName) {
  const folder = prompt(`📁 Choose folder 1–5 to save:\n\n"${songName}"`);
  const num = parseInt(folder);
  if (num >= 1 && num <= 5) {
    addToFolder(num, songName);
  } else {
    alert("❌ Invalid folder number. Choose 1 to 5.");
  }
}

// === Right Click / Long Press Handler ===
function setupRightClickPaste() {
  const select = document.getElementById("songSelect");

  // 🖱️ Desktop right-click
  select.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const selectedSong = select.value;
    if (selectedSong) {
      showFolderChoice(selectedSong);
    }
  });

  // 🤏 Mobile long-press
  select.addEventListener("touchstart", (e) => {
    longPressTimer = setTimeout(() => {
      const selectedSong = select.value;
      if (selectedSong) {
        showFolderChoice(selectedSong);
      }
    }, 700); // 700ms for long press
  });

  select.addEventListener("touchend", () => {
    clearTimeout(longPressTimer);
  });

  select.addEventListener("touchmove", () => {
    clearTimeout(longPressTimer);
  });
}

// === Run on Load ===
document.addEventListener("DOMContentLoaded", () => {
  setupRightClickPaste();
  renderFavorites();
});
