let draggedElement = null;

function updateBookmarkOrder(songList) {
  const folder = songList.dataset.folder;
  const songs = Array.from(songList.children).map(div => div.childNodes[0].nodeValue.trim());
  const bookmarks = JSON.parse(localStorage.getItem("bookmarkedSongs") || "{}");
  bookmarks[folder] = songs;
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
  console.log("✅ Bookmark order updated:", bookmarks);
}

function updateBookmarksAfterDelete(song, folder) {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarkedSongs") || "{}");
  if (!bookmarks[folder]) return;
  bookmarks[folder] = bookmarks[folder].filter(s => s !== song);
  localStorage.setItem("bookmarkedSongs", JSON.stringify(bookmarks));
  console.log("🗑️ Song removed from bookmarks:", song);
}

// 🧠 Load from localStorage
function loadBookmarks() {
  const data = localStorage.getItem("bookmarkedSongs");
  if (!data) return;

  const bookmarks = JSON.parse(data);
  for (const folder in bookmarks) {
    const songList = document.querySelector(`.song-list[data-folder="${folder}"]`);
    if (songList) {
      bookmarks[folder].forEach(song => {
        const div = document.createElement("div");
        div.className = "bookmarkedSong";
        div.textContent = song;
        div.setAttribute("draggable", "true");

        // 🎵 AUTOPLAY ON CLICK
        div.addEventListener("click", () => {
          console.log("📌 Clicked bookmarked song:", song);
          const dropdown = document.getElementById("songDropdown");
          if (dropdown) {
            dropdown.value = song;
            dropdown.dispatchEvent(new Event("change")); // trigger lyrics/audio
          } else {
            console.error("❌ songDropdown not found in DOM");
          }
        });

        // 🧲 DRAG LOGIC
        div.addEventListener("dragstart", (e) => {
          draggedElement = div;
        });

        div.addEventListener("dragover", (e) => {
          e.preventDefault();
          div.style.borderTop = "2px dashed #555";
        });

        div.addEventListener("dragleave", () => {
          div.style.borderTop = "";
        });

        div.addEventListener("drop", () => {
          div.style.borderTop = "";
          if (draggedElement && draggedElement !== div) {
            const parent = div.parentNode;
            parent.insertBefore(draggedElement, div);
            updateBookmarkOrder(parent);
          }
        });

        // 🗑️ DELETE BUTTON
        const deleteBtn = document.createElement("span");
        deleteBtn.textContent = "🗑️";
        deleteBtn.style.float = "right";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.addEventListener("click", () => {
          div.remove();
          updateBookmarksAfterDelete(song, folder);
        });
        div.appendChild(deleteBtn);

        songList.appendChild(div);
      });
    }
  }
}
