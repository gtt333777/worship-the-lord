// 🚀 Dynamically load modular HTML sections into index.html

const htmlSections = [
    { file: 'audioControl.html', containerId: 'audioControlContainer', initializer: initializeAudioControls },
    { file: 'bookmarkManager.html', containerId: 'bookmarkManagerContainer', initializer: initializeBookmarkManager },
    { file: 'loopManager.html', containerId: 'loopManagerContainer', initializer: initializeLoopManager },
    { file: 'lyricsLoader.html', containerId: 'lyricsLoaderContainer', initializer: initializeLyricsLoader },
    { file: 'pwaSetup.html', containerId: 'pwaSetupContainer', initializer: initializePwaSetup },
    { file: 'skipControl.html', containerId: 'skipControlContainer', initializer: initializeSkipControl },
    { file: 'songLoader.html', containerId: 'songLoaderContainer', initializer: initializeSongLoader },
    { file: 'songNamesLoader.html', containerId: 'songNamesLoaderContainer', initializer: initializeSongNamesLoader },
];

function loadHtmlSection(section) {
    const { file, containerId, initializer } = section;

    fetch(`WorshipApp_Modular/${file}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${file} (status ${response.status})`);
            }
            return response.text();
        })
        .then(html => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;
                console.log(`✅ Loaded and injected: ${file}`);

                // Call the initializer function if defined
                if (typeof initializer === 'function') {
                    try {
                        initializer();
                        console.log(`✅ Initialized: ${file}`);
                    } catch (initError) {
                        console.error(`❌ Error initializing ${file}:`, initError);
                    }
                }
            } else {
                console.warn(`⚠️ Container with id "${containerId}" not found for ${file}`);
            }
        })
        .catch(error => {
            console.error(`❌ Error loading ${file}:`, error);
        });
}

function loadAllHtmlSections() {
    htmlSections.forEach(loadHtmlSection);
}

// Call on window load
window.addEventListener('DOMContentLoaded', loadAllHtmlSections);
