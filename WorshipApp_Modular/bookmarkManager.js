// ✅ GLOBALS (used safely in other files)
let favoriteSongs = {};
let currentFolder = "Favorites 1";

// ✅ Robust logger
console.log("📚 Bookmark Manager loaded.");

function loadFavorites() {
  try {
    const stored = localStorage.getItem("favoriteSongs");
    if (stored) {
      favoriteSongs = JSON.parse(stored);
      console.log("✅ Favorites loaded:", favoriteSongs);
    } else {
      console.log("ℹ️ No existing favorites found.");
    }
  } catch (e) {
    console.error("❌ Failed to load favorites:", e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("favoriteSongs", JSON.stringify(favoriteSongs));
    console.log("💾 Favorites saved:", favoriteSongs);
  } catch (e) {
    console.error("❌ Failed to save favorites:", e);
  }
}

function bookmarkCurrentSong() {
  const select = document.getElementById("songSelect");
  const selectedSong = select.value.trim();
  if (!selectedSong) return;

  if (!favoriteSongs[currentFolder]) {
    favoriteSongs[currentFolder] = [];
  }

  if (!favoriteSongs[currentFolder].includes(selectedSong)) {
    favoriteSongs[currentFolder].push(selectedSong);
    saveFavorites();
    console.log(`⭐ '${selectedSong}' added to '${currentFolder}'`);
  } else {
    console.log(`⚠️ '${selectedSong}' already exists in '${currentFolder}'`);
  }
}

function setCurrentFolder(folder) {
  currentFolder = folder;
  console.log(`📂 Switched to folder: ${folder}`);
}

function showBookmarkFolders() {
  const select = document.getElementById("favoriteSelect");
  select.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const opt = document.createElement("option");
    opt.value = `Favorites ${i}`;
    opt.textContent = `Favorites ${i}`;
    select.appendChild(opt);
  }

  select.value = currentFolder;
  select.style.display = "inline-block";
  console.log("📁 Folder selector shown.");
}

function renderBookmarkFolders() {
  loadFavorites();
  showBookmarkFolders();
}
