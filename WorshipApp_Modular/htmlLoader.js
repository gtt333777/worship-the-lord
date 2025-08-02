window.addEventListener("DOMContentLoaded", () => {
  const htmlFolder = "WorshipApp_Modular/";
  const htmlFiles = [
    "audioControl",
    "bookmarkManager",
    "loopManager",
    "lyricsLoader",
    "pwaSetup",
    "skipControl",
    "songLoader",
    "songNamesLoader"
  ];

  htmlFiles.forEach(file => {
    const path = `${htmlFolder}${file}.html`;

    fetch(path)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container);
        console.log(`✅ ${file}.html loaded successfully.`);
      })
      .catch(error => {
        console.error(`❌ Error loading ${file}.html → ${error.message}`);
      });
  });
});
