// === BOOKMARK STORAGE LOGIC ===
function getBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarks")) || {
    folder1: [],
    folder2: [],
    folder3: [],
    folder4: [],
    folder5: []
  };
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

// === SHOW BOOKMARK FOLDERS ===
function showBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  container.style.display = container.style.display === "none" ? "block" : "none";

  const view = document.getElementById("bookmarkFoldersView");
  view.innerHTML = "";

  const bookmarks = getBookmarks();

  for (let i = 1; i <= 5; i++) {
    const folder = document.createElement("div");
    folder.className = "folder";
    folder.innerHTML = `<h3>Favorites ${i}</h3>`;

    bookmarks[`folder${i}`].forEach((song, index) => {
      const songDiv = document.createElement("div");
      songDiv.className = "song-entry";
      songDiv.draggable = true;
      songDiv.textContent = song;

      // === Drag Logic ===
      songDiv.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ folder: `folder${i}`, index }));
      });

      // === Delete Icon ===
      const del = document.createElement("span");
      del.textContent = "❌";
      del.className = "delete-icon";
      del.onclick = () => {
        bookmarks[`folder${i}`].splice(index, 1);
        saveBookmarks(bookmarks);
        showBookmarkFolders(); // Refresh
      };
      songDiv.appendChild(del);
      folder.appendChild(songDiv);
    });

    // === Paste Target ===
    folder.ondragover = (e) => e.preventDefault();
    folder.ondrop = (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const song = bookmarks[data.folder][data.index];
      if (!bookmarks[`folder${i}`].includes(song)) {
        bookmarks[`folder${i}`].push(song);
        saveBookmarks(bookmarks);
        showBookmarkFolders();
      }
    };

    view.appendChild(folder);
  }
}

// === BOOKMARK BUTTON LOGIC ===
function handleBookmarkButtonClick() {
  const tamilName = window.currentTamilSongName;
  if (!tamilName) return alert("⚠️ No song selected!");

  const folderSelect = document.createElement("select");
  for (let i = 1; i <= 5; i++) {
    const opt = document.createElement("option");
    opt.value = `folder${i}`;
    opt.textContent = `Favorites ${i}`;
    folderSelect.appendChild(opt);
  }

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "✅ Save";
  confirmBtn.style.marginLeft = "10px";

  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.padding = "15px";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  popup.style.zIndex = "9999";
  popup.style.borderRadius = "8px";
  popup.appendChild(folderSelect);
  popup.appendChild(confirmBtn);
  document.body.appendChild(popup);

  confirmBtn.onclick = () => {
    const folder = folderSelect.value;
    const bookmarks = getBookmarks();
    if (!bookmarks[folder].includes(tamilName)) {
      bookmarks[folder].push(tamilName);
      saveBookmarks(bookmarks);
    }
    document.body.removeChild(popup);
    alert("✅ Bookmarked!");
  };
}
