// htmlLoader.js
console.log("htmlLoader.js: Started");

// Define the function globally so it's accessible from index.html
window.loadHTML = function (id) {
  const placeholder = document.getElementById(id);
  if (!placeholder) {
    console.warn(`⚠️ htmlLoader.js: Placeholder div not found for '${id}'`);
    return;
  }

  fetch(`${id}.html`)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load '${id}.html'`);
      return response.text();
    })
    .then((html) => {
      placeholder.innerHTML = html;
      console.log(`✅ htmlLoader.js: Successfully loaded '${id}.html'`);
    })
    .catch((err) => {
      console.error(`❌ htmlLoader.js: Error loading '${id}.html':`, err);
    });
};
