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




// ======================================================
// === CLEAN & STABLE PWA INSTALL HANDLING (Chrome 2025) ===
// ======================================================

let deferredPrompt = null;

// 1️⃣ Capture install event when browser decides app is installable
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  console.log("📥 Install prompt captured and ready.");
});

// 2️⃣ Install button handler (your top header button)
window.showInstallPrompt = async () => {
  if (!deferredPrompt) {
    // This message only appears for:
    // - already installed users
    // - browsers that don’t support PWA install
    alert("App is already installed or not installable yet.");
    return;
  }

  // Show install prompt
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  console.log("📲 User install choice:", outcome);

  // Important: reset
  deferredPrompt = null;
};

// 3️⃣ When installation is completed successfully
window.addEventListener("appinstalled", () => {
  console.log("🎉 App installed successfully!");
});
