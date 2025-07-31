// === Bookmark Manager ===

// Utility to load bookmarks from localStorage
function loadBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarks") || `{
    "Favorites 1": [],
    "Favorites 2": [],
    "Favorites 3": [],
    "Favorites 4": [],
    "Favorites 5": []
  }`);
}

// Utility to save bookmarks to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

// Populate the Bookmarked Songs section with folders and songs
function populateBookmarkDropdown() {
  const container = document.getElementById("bookmarkedContainer");
  container.innerHTML = "";

  const bookmarks = loadBookmarks();
  Object.keys(bookmarks).forEach(folder => {
    const folderHeading = document.createElement("h3");
    folderHeading.textContent = `📂 ${folder}`;
    folderHeading.style.marginTop = "20px";
    container.appendChild(folderHeading);

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";

    bookmarks[folder].forEach((song, index) => {
      const li = document.createElement("li");
      li.style.margin = "5px 0";
      li.style.background = "#eef3f7";
      li.style.padding = "10px";
      li.style.borderRadius = "8px";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.setAttribute("draggable", "true");

      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ folder, index }));
      });

      li.addEventListener("dragover", e => e.preventDefault());

      li.addEventListener("drop", e => {
        e.preventDefault();
        const from = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (from.folder === folder && from.index !== index) {
          const list = bookmarks[folder];
          const [moved] = list.splice(from.index, 1);
          list.splice(index, 0, moved);
          saveBookmarks(bookmarks);
          populateBookmarkDropdown();
        }
      });

      const songSpan = document.createElement("span");
      songSpan.textContent = song;
      li.appendChild(songSpan);

      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.style.marginLeft = "10px";
      del.onclick = () => {
        bookmarks[folder].splice(index, 1);
        saveBookmarks(bookmarks);
        populateBookmarkDropdown();
      };
      li.appendChild(del);

      list.appendChild(li);
    });

    container.appendChild(list);
  });
}

// === Right-click COPY from Song List ===
let copiedSong = null;

document.getElementById("songSelect").addEventListener("contextmenu", function (e) {
  e.preventDefault();
  copiedSong = e.target.value;
  alert(`✅ Copied: "${copiedSong}"\nNow right-click on a folder to paste.`);
});

// === Right-click PASTE into Folder ===
document.addEventListener("contextmenu", function (e) {
  if (!e.target.matches("h3")) return;

  const folder = e.target.textContent.replace("📂 ", "").trim();
  if (!copiedSong) {
    alert("⚠️ No song copied yet. Right-click a song name first.");
    return;
  }

  const bookmarks = loadBookmarks();
  if (!bookmarks[folder]) {
    alert("❌ Invalid folder.");
    return;
  }

  if (bookmarks[folder].includes(copiedSong)) {
    alert("⚠️ Song already in this folder.");
    return;
  }

  bookmarks[folder].push(copiedSong);
  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
  alert(`🎉 Pasted into ${folder}: "${copiedSong}"`);
});
