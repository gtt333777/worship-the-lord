document.addEventListener("DOMContentLoaded", function () {
    const folder = "."; // ✅ Now points to root (not worshipapp_modular)

    const placeholders = {
        "lyricsLoader": "lyrics-loader-placeholder",
        "loopManager": "loop-manager-placeholder",
        "audioControl": "audio-control-placeholder",
        "songLoader": "song-loader-placeholder",
        "songNamesLoader": "song-names-loader-placeholder",
        "bookmarkManager": "bookmark-manager-placeholder",
        "pwaSetup": "pwa-setup-placeholder"
    };

    Object.keys(placeholders).forEach(fileKey => {
        const placeholderId = placeholders[fileKey];
        const placeholder = document.getElementById(placeholderId);

        if (!placeholder) {
            console.warn(`⚠️ Placeholder not found for ${fileKey}`);
            return;
        }

        const htmlPath = `${folder}/${fileKey}.html`;

        fetch(htmlPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${htmlPath}`);
                }
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                console.log(`✅ Injected ${fileKey}.html`);
            })
            .catch(error => {
                console.error(`❌ Error loading ${htmlPath}:`, error);
            });
    });
});
