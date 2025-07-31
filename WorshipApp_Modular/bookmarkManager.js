// === Globals ===
let selectedSongToBookmark = "";
let currentBookmarkTarget = null;

// === Show/Hide Bookmarked Folders ===
function showBookmarkFolders() {
  const container = document.getElementById('bookmarkedContainer');
  if (container.style.display === 'none') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// === Create Favorites Folder Layout ===
const bookmarkFolders = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: []
};

// === Load Bookmark UI on page load ===
function renderBookmarkFolders() {
  const container = document.getElementById("bookmarkedContainer");
  container.innerHTML = ""; // Clear previous

  for (let i = 1; i <= 5; i++) {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";
    folderDiv.id = `folder-${i}`;

    const header = document.createElement("h3");
    header.textContent = `Favorites ${i}`;
    folderDiv.appendChild(header);

    bookmarkFolders[i].forEach((song, index) => {
      const entry = document.createElement("div");
      entry.className = "song-entry";
      entry.draggable = true;
      entry.textContent = song;

      // Delete icon
      const del = document.createElement("span");
      del.textContent = "❌";
      del.className = "delete-icon";
      del.onclick = () => {
        bookmarkFolders[i].splice(index, 1);
        renderBookmarkFolders();
      };
      entry.appendChild(del);

      // Drag events
      entry.addEventListener("dragstart", (e) => {
        currentBookmarkTarget = { song, fromFolder: i, fromIndex: index };
      });

      folderDiv.addEventListener("dragover", (e) => e.preventDefault());
      folderDiv.addEventListener("drop", (e) => {
        e.preventDefault();
        if (currentBookmarkTarget && currentBookmarkTarget.fromFolder !== i) {
          // Remove from old
          bookmarkFolders[currentBookmarkTarget.fromFolder].splice(currentBookmarkTarget.fromIndex, 1);
          // Add to new
          bookmarkFolders[i].push(currentBookmarkTarget.song);
          currentBookmarkTarget = null;
          renderBookmarkFolders();
        }
      });

      folderDiv.appendChild(entry);
    });

    container.appendChild(folderDiv);
  }
}

// === Called from outside to show bookmark selector
function triggerBookmarkDropdown(songName) {
  selectedSongToBookmark = songName;

  // Create dropdown UI just below the Bookmarked Songs button
  let dropdown = document.getElementById("bookmarkDropdownUI");
  if (dropdown) dropdown.remove(); // Remove old one

  dropdown = document.createElement("div");
  dropdown.id = "bookmarkDropdownUI";
  dropdown.style.background = "#fff";
  dropdown.style.padding = "10px";
  dropdown.style.border = "1px solid #ccc";
  dropdown.style.borderRadius = "6px";
  dropdown.style.margin = "10px auto";
  dropdown.style.width = "220px";

  const label = document.createElement("div");
  label.textContent = "📁 Add to:";
  dropdown.appendChild(label);

  const select = document.createElement("select");
  select.id = "folderSelector";
  for (let i = 1; i <= 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Favorites ${i}`;
    select.appendChild(option);
  }
  dropdown.appendChild(select);

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "✅ Save";
  saveBtn.style.marginTop = "8px";
  saveBtn.onclick = () => {
    const selected = parseInt(document.getElementById("folderSelector").value);
    if (!bookmarkFolders[selected].includes(selectedSongToBookmark)) {
      bookmarkFolders[selected].push(selectedSongToBookmark);
      renderBookmarkFolders();
    }
    dropdown.remove();
  };
  dropdown.appendChild(saveBtn);

  const parent = document.getElementById("bookmarkedContainer");
  parent.parentElement.insertBefore(dropdown, parent);
}

// === Init on Load ===
document.addEventListener("DOMContentLoaded", () => {
  renderBookmarkFolders();
});
