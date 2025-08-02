// 🎵 songNamesLoader.js – Loads song names from lyrics/songs_names.txt

function populateSongDropdown() {
    console.log("🎬 populateSongDropdown: Starting fetch of lyrics/songs_names.txt");

    fetch('lyrics/songs_names.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            console.log("✅ Successfully fetched songs_names.txt");
            const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
            console.log(`📄 Found ${lines.length} song name(s) in file.`);

            const dropdown = document.getElementById('songDropdown');
            if (!dropdown) {
                console.error("❌ songDropdown element not found in DOM.");
                return;
            }

            dropdown.innerHTML = ''; // Clear existing

            lines.forEach((line, index) => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                dropdown.appendChild(option);
                console.log(`🎶 Added song ${index + 1}: "${line}" to dropdown`);
            });

            console.log("🎉 Song dropdown populated successfully.");
        })
        .catch(error => {
            console.error("🚨 Error loading songs_names.txt:", error);
        });
}

// 🛠 Ensure DOM is ready before trying to access elements
document.addEventListener("DOMContentLoaded", () => {
    console.log("📦 songNamesLoader.js: DOMContentLoaded event fired.");
    populateSongDropdown();
});
