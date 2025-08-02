// === PWA Setup ===

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => {
      console.log("✅ Service Worker registered");
    })
    .catch(err => {
      console.error("❌ Service Worker registration failed:", err);
    });
}

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBar = document.getElementById("installPrompt");
  if (installBar) {
    installBar.style.display = "block";
  }
});
