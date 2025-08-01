// ✅ Globals
let currentFolder = "Favorites 1";

// 🔁 Get localStorage key for a folder
function getBookmarkKey(folderName) {
  return `bookmarks_${folderName}`;
}

// 🔁 Load bookmarks for a folder
function loadBookmarks(folderName) {
  const key = getBookmarkKey(folderName);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// 💾 Save a song to current folder
function bookmarkCurrentSong() {
  const song = document.getElementById("songSelect").value.trim();
  const folder = document.getElementById("favoriteSelect").value;
  const key = getBookmarkKey(folder);

  let songs = loadBookmarks(folder);
  if (!songs.includes(song)) {
    songs.push(song);
    localStorage.setItem(key, JSON.stringify(songs));
    console.log(`✅ '${song}' bookmarked to ${folder}`);
  } else {
    console.log(`⚠️ '${song}' already in ${folder}`);
  }
}

// 📁 Change current folder
function setCurrentFolder(folder) {
  currentFolder = folder;
  localStorage.setItem("currentBookmarkFolder", folder);
}

// 📋 Build Favorites folders and entries
function renderBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  if (!container) {
    console.warn("❌ Container for bookmarks not found");
    return;
  }

  container.innerHTML = ""; // clear old

  const folderNames = ["Favorites 1", "Favorites 2", "Favorites 3", "Favorites 4", "Favorites 5"];
  folderNames.forEach(folder => {
    const songs = loadBookmarks(folder);
    if (songs.length === 0) return;

    const div = document.createElement("div");
    div.className = "folder";

    const heading = document.createElement("h3");
    heading.textContent = folder;
    div.appendChild(heading);

    songs.forEach(song => {
      const entry = document.createElement("div");
      entry.className = "song-entry";
      entry.textContent = song;

      entry.onclick = () => {
        const select = document.getElementById("songSelect");
        select.value = song;
        loadLyricsForSelectedSong(select);
      };

      div.appendChild(entry);
    });

    container.appendChild(div);
  });

  console.log("📂 Bookmarked folders rendered.");
}

// 🎯 Show folders when button is pressed
function showBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  if (!container) return;

  renderBookmarkFolders();
  container.style.display = "block";
  console.log("📋 Bookmarked Songs opened.");
}

// 🔁 Populate dropdown on load
function showBookmarkFoldersDropdown() {
  const select = document.getElementById("favoriteSelect");
  if (!select) return;

  select.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const opt = document.createElement("option");
    opt.value = `Favorites ${i}`;
    opt.textContent = `Favorites ${i}`;
    select.appendChild(opt);
  }

  select.value = currentFolder;
  select.style.display = "inline-block";
  console.log("🔽 Folder dropdown shown.");
}

// ✅ Called on page load
function renderBookmarkFoldersOnLoad() {
  const saved = localStorage.getItem("currentBookmarkFolder");
  if (saved) currentFolder = saved;

  showBookmarkFoldersDropdown();
}
