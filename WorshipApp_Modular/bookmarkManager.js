// ✅ bookmarkManager.js

// --------- GLOBAL STORAGE ----------
let bookmarks = JSON.parse(localStorage.getItem("bookmarks") || '{}');
let currentFolder = "Favorites 1";

// --------- LOAD ALL BOOKMARKS ----------
function renderBookmarkFolders() {
    console.log("📚 Rendering all bookmark folders...");
    for (let i = 1; i <= 5; i++) {
        const folder = `Favorites ${i}`;
        const container = document.getElementById(`folder${i}`);
        if (!container) {
            console.warn(`⚠️ Missing container for ${folder}`);
            continue;
        }
        container.innerHTML = `<h3>${folder}</h3>`;
        (bookmarks[folder] || []).forEach((song, index) => {
            const div = document.createElement("div");
            div.className = "bookmarkItem";
            div.innerText = song;
            div.title = "Click to play this song";

            // ✅ NEW: Clicking the song from favorites plays it
            div.onclick = () => {
                console.log(`🎵 Song clicked from bookmarks: "${song}"`);
                const select = document.getElementById("songSelect");
                let found = false;
                for (let opt of select.options) {
                    if (opt.text === song) {
                        select.value = opt.value;
                        select.dispatchEvent(new Event("change"));
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.warn(`⚠️ Song "${song}" not found in dropdown`);
                }
            };

            const delBtn = document.createElement("button");
            delBtn.innerHTML = "🗑️";
            delBtn.style.marginLeft = "8px";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                console.log(`🗑️ Removing bookmark: "${song}" from ${folder}`);
                bookmarks[folder].splice(index, 1);
                saveBookmarks();
                renderBookmarkFolders();
            };

            div.appendChild(delBtn);
            container.appendChild(div);
        });
    }
}

// --------- SAVE TO LOCALSTORAGE ----------
function saveBookmarks() {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    console.log("💾 Bookmarks saved.");
}

// --------- SHOW FOLDER PICKER ----------
function showBookmarkFolders() {
    const select = document.getElementById("favoriteSelect");
    if (select) {
        select.style.display = "inline-block";
        console.log("📂 Folder selector shown.");
    } else {
        console.warn("⚠️ favoriteSelect element not found.");
    }
}

// --------- SET CURRENT FOLDER ----------
function setCurrentFolder(folderName) {
    currentFolder = folderName;
    console.log("📁 Folder set to:", currentFolder);
}

// --------- ADD SONG TO CURRENT FOLDER ----------
function bookmarkCurrentSong() {
    const select = document.getElementById("songSelect");
    if (!select) {
        console.warn("⚠️ songSelect dropdown not found.");
        return;
    }

    const song = select.options[select.selectedIndex]?.text;
    if (!song) {
        console.warn("⚠️ No song selected to bookmark.");
        return;
    }

    if (!bookmarks[currentFolder]) bookmarks[currentFolder] = [];

    if (!bookmarks[currentFolder].includes(song)) {
        bookmarks[currentFolder].push(song);
        console.log(`⭐ Bookmarked "${song}" in ${currentFolder}`);
        saveBookmarks();
        renderBookmarkFolders();
    } else {
        console.log(`⚠️ Song "${song}" already bookmarked in ${currentFolder}`);
    }
}
