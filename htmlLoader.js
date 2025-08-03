// htmlLoader.js
console.log("htmlLoader.js: Started");

const folder = ".";
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

        // Dispatch custom event so the corresponding JS knows it's safe to run
        document.dispatchEvent(new Event(`${section}Loaded`));
      })
      .catch(error => {
        console.error(`❌ Error loading ${section}.html:`, error);
      });
  });
});
