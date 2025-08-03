document.addEventListener("DOMContentLoaded", () => {
  const folder = "."; // now pointing to root directory
  const components = [
    "audioControl",
    "bookmarkManager",
    "loopManager",
    "lyricsLoader",
    "songLoader",
    "songNamesLoader",
    "pwaSetup"
  ];

  components.forEach(component => {
    const htmlPath = `${folder}/${component}.html`;
    fetch(htmlPath)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${htmlPath}`);
        return response.text();
      })
      .then(html => {
        const placeholder = document.getElementById(component);
        if (placeholder) {
          placeholder.innerHTML = html;
          console.log(`✅ Injected ${component}.html`);
        } else {
          console.warn(`⚠️ Placeholder not found for ${component}`);
        }
      })
      .catch(error => console.error(`❌ Error loading ${htmlPath}:`, error));
  });
});
