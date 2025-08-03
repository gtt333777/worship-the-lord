// htmlLoader.js
console.log("✅ htmlLoader.js: Started");

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
      console.warn(`⚠️ Container missing: ${section}`);
      return;
    }

    fetch(`${section}.html`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${section}.html`);
        return res.text();
      })
      .then(html => {
        container.innerHTML = html;
        console.log(`✅ htmlLoader.js: Successfully loaded '${section}.html'`);
      })
      .catch(err => {
        console.error(`❌ htmlLoader.js: Error loading ${section}.html`, err);
      });
  });
});
