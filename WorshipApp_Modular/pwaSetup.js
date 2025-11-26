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


// ===============================
// 🌟 PWA Setup & Auto-Update
// ===============================

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration.scope);

      // 🔄 Auto-update whenever new SW arrives
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("🆕 New version ready — activating...");
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // When new SW takes control → reload once
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔁 Reloading after SW activation…");
        window.location.reload();
      });
    })
    .catch((err) => {
      console.error("❌ Service Worker registration failed:", err);
    });
}


// ===============================
// 🌟 Install Prompt Handling
// ===============================

let deferredPrompt = null;

// Capture the event
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("📥 Install prompt captured.");
});

// Manual install button handler
window.showInstallPrompt = async () => {
  if (!deferredPrompt) {
    alert("App is already installed or not installable yet.");
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log("📲 User install choice:", outcome);

  deferredPrompt = null;
};

// Installed event
window.addEventListener("appinstalled", () => {
  console.log("🎉 App installed successfully!");
});
