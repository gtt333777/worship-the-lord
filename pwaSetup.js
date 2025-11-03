// === PWA Setup & Auto-Update ===

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration.scope);

      // 🔄 Listen for updates to the Service Worker
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("🆕 New version available. Activating...");
              // Tell waiting SW to activate immediately
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });

      // 🔁 When the new version takes control, reload automatically
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔁 New version activated — reloading app");
        window.location.reload();
      });
    })
    .catch((err) => {
      console.error("❌ Service Worker registration failed:", err);
    });
}

// === PWA Install Prompt Handling ===
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBar = document.getElementById("installPrompt");
  if (installBar) {
    installBar.style.display = "block";

    const installButton = document.getElementById("installButton");
    if (installButton) {
      installButton.onclick = async () => {
        installBar.style.display = "none";
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`📲 User install choice: ${outcome}`);
        deferredPrompt = null;
      };
    }
  }
});

// === Optional: Listen for successful app install ===
window.addEventListener("appinstalled", () => {
  console.log("🎉 App installed successfully!");
  const installBar = document.getElementById("installPrompt");
  if (installBar) installBar.style.display = "none";
});



/*
// Fallback: manual install button
window.showInstallPrompt = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Manual install outcome: ${outcome}`);
    deferredPrompt = null;
  } else {
    alert("App is already installable or installed!");
  }
};
*/