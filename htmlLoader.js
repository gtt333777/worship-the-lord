// WorshipApp_Modular/htmlLoader.js

document.addEventListener("DOMContentLoaded", function () {
  const htmlFiles = [
    "audioControl",
    "songNamesLoader",
    "songLoader",
    "lyricsLoader",
    "bookmarkManager",
    "loopManager"
  ];

  htmlFiles.forEach((file) => {
    fetch(`WorshipApp_Modular/${file}.html`)
      .then((response) => response.text())
      .then((html) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        if (file === "audioControl") {
          const placeholder = document.getElementById("audioControlPlaceholder");
          if (placeholder) {
            placeholder.innerHTML = html;
            console.log("✅ Injected audioControl.html into placeholder");
          } else {
            console.warn("⚠️ Placeholder not found for audioControl");
            document.body.appendChild(tempDiv);
          }
        } else {
          document.body.appendChild(tempDiv);
          console.log(`✅ Injected ${file}.html`);
        }
      })
      .catch((err) => console.error(`❌ Failed to load ${file}.html`, err));
  });
});
