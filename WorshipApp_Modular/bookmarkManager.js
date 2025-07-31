// === Bookmark Manager ===

// Globals to track pending action
let pendingAction = null;
let pendingSong = null;
let draggedItem = null;

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

function openBookmarkModal() {
  const dropdown = document.getElementById("songSelect");
  const selectedSong = dropdown.value;
  if (!selectedSong) return;

  const bookmarks = loadBookmarks();
  let folderWithSong = null;

  for (let folder in bookmarks) {
    if (bookmarks[folder].includes(selectedSong)) {
      folderWithSong = folder;
      break;
    }
  }

  pendingSong = selectedSong;
  pendingAction = folderWithSong ? "unbookmark" : "bookmark";
  showFolderModal();
}

function showFolderModal() {
  const label = document.querySelector("#folderModal label");
  if (pendingAction === "bookmark") {
    label.textContent = "📁 Select folder to ADD this song:";
  } else {
    label.textContent = "📁 Select folder to REMOVE this song:";
  }

  document.getElementById("folderModal").style.display = "block";
  document.getElementById("folderSelect").value = "";
}

function cancelFolder() {
  document.getElementById("folderModal").style.display = "none";
  pendingAction = null;
  pendingSong = null;
}

function confirmFolder() {
  const folder = document.getElementById("folderSelect").value;
  if (!folder) return;

  const bookmarks = loadBookmarks();

  if (pendingAction === "bookmark") {
    if (!bookmarks[folder].includes(pendingSong)) {
      bookmarks[folder].push(pendingSong);
    }
  } else if (pendingAction === "unbookmark") {
    bookmarks[folder] = bookmarks[folder].filter(song => song !== pendingSong);
  }

  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
  cancelFolder();
}

function populateBookmarkDropdown() {
  const bookmarks = loadBookmarks();

  // === Update Dropdown ===
  const dropdown = document.getElementById("bookmarkDropdown");
  dropdown.innerHTML = `<option value="">🎯 Bookmarked Songs</option>`;
  Object.keys(bookmarks).forEach(folder => {
    bookmarks[folder].forEach(song => {
      const opt = document.createElement("option");
      opt.value = song;
      opt.textContent = `${folder} → ${song}`;
      dropdown.appendChild(opt);
    });
  });

  // === Update Folder Display with Draggables & Delete Buttons ===
  const view = document.getElementById("bookmarkFoldersView");
  view.innerHTML = "";

  Object.keys(bookmarks).forEach(folder => {
    const title = document.createElement("h3");
    title.textContent = `📂 ${folder}`;
    view.appendChild(title);

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.dataset.folder = folder;

    bookmarks[folder].forEach(song => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.padding = "6px";
      li.style.margin = "4px";
      li.style.border = "1px solid #ccc";

      // Song text
      const span = document.createElement("span");
      span.textContent = song;
      span.draggable = true;
      span.dataset.song = song;
      span.style.flex = "1";
      span.style.cursor = "grab";

      span.addEventListener("dragstart", handleDragStart);
      span.addEventListener("dragover", handleDragOver);
      span.addEventListener("drop", handleDrop);

      // 🗑️ Delete button
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.style.marginLeft = "10px";
      delBtn.onclick = () => {
        if (confirm(`Remove "${song}" from ${folder}?`)) {
          bookmarks[folder] = bookmarks[folder].filter(s => s !== song);
          saveBookmarks(bookmarks);
          populateBookmarkDropdown();
        }
      };

      li.appendChild(span);
      li.appendChild(delBtn);
      list.appendChild(li);
    });

    view.appendChild(list);
  });
}

// === Drag & Drop Handlers ===
function handleDragStart(e) {
  draggedItem = e.target;
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();

  const list = e.target.closest("ul");
  if (!list || draggedItem === e.target) return;

  const folder = list.dataset.folder;
  const bookmarks = loadBookmarks();
  const draggedSong = draggedItem.dataset.song;
  const targetSong = e.target.dataset.song;

  const newList = bookmarks[folder].filter(s => s !== draggedSong);
  const dropIndex = newList.indexOf(targetSong);
  newList.splice(dropIndex, 0, draggedSong);

  bookmarks[folder] = newList;
  saveBookmarks(bookmarks);
  populateBookmarkDropdown();
}

// === Bookmark Dropdown Selection Handler ===
function handleBookmarkDropdownChange() {
  const name = document.getElementById("bookmarkDropdown").value;
  if (!name) return;

  // Select the song in the main dropdown
  const songSelect = document.getElementById("songSelect");
  Array.from(songSelect.options).forEach(opt => {
    if (opt.value === name) opt.selected = true;
  });

  loadLyricsForSelectedSong(songSelect);
}

// === Initial Setup on Page Load ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("bookmarkDropdown").addEventListener("change", handleBookmarkDropdownChange);
  populateBookmarkDropdown();
});
