// ✅ Robust htmlLoader.js for loading modular HTML parts dynamically

window.addEventListener('DOMContentLoaded', () => {
  console.log("📦 htmlLoader.js: DOM fully loaded, beginning HTML injection...");

  const scriptTags = document.querySelectorAll('script[src]');
  scriptTags.forEach(script => {
    const src = script.getAttribute('src');

    // Only process scripts from WorshipApp_Modular
    if (!src.includes('WorshipApp_Modular/')) return;

    const baseName = src.split('/').pop().replace('.js', '');
    const htmlFile = `WorshipApp_Modular/${baseName}.html`;

    console.log(`🔄 Trying to load ${htmlFile} to match ${src}`);

    fetch(htmlFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`❌ Failed to fetch ${htmlFile}: HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(htmlContent => {
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
        console.log(`✅ Successfully loaded and injected: ${htmlFile}`);
      })
      .catch(error => {
        console.error(`⚠️ Error loading ${htmlFile}:`, error);
      });
  });
});
