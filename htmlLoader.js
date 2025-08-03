// htmlLoader.js
console.log("htmlLoader.js: Started");

const folder = "."; // Load .html files from root

const htmlSections = [
  "audioControl",
  "bookmarkManager",
  "loopManager",
  "lyricsLoader",
  "pwaSetup",
  "skipControl",
  "songLoader",
  "songNamesLoader",
  "tokenLoader"
];

window.addEventListener("DOMContentLoaded", () => {
  htmlSections.forEach(section => {
    const container = document.getElementById(section);
    if (!container) {
      console.warn(`⚠️ Placeholder not found for ${section}`);
      return;
    }

    fetch(`${folder}/${section}.html`)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${section}.html`);
        return response.text();
      })
      .then(html => {
        container.innerHTML = html;
        console.log(`✅ Loaded: ${section}.html`);
      })
      .catch(error => {
        console.error(`❌ Error loading ${section}.html:`, error);
      });
  });
});
