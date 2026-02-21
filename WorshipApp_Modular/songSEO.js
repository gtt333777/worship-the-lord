// WorshipApp_Modular/songSEO.js
console.log("🔎 songSEO.js started");

/* --------------------------------------------------
   Convert song name into URL-friendly text
-------------------------------------------------- */
function slugifySong(name) {
    return name.toLowerCase().trim();
}


/* --------------------------------------------------
   Build visible SEO song list (Google crawlable)
-------------------------------------------------- */
async function buildSEOSongList() {

    const ul = document.getElementById("seoSongsUL");
    if (!ul) return;

    try {
        const res = await fetch("lyrics/songs_names.txt");
        const text = await res.text();

        const lines = text.split("\n").filter(Boolean);

        lines.forEach(line => {

            // split Tamil + English name
            const parts = line.trim().split(/\s{2,}/);
            const english = parts[1] || parts[0];

            const li = document.createElement("li");

            const a = document.createElement("a");
            a.href = `?song=${encodeURIComponent(english)}`;
            a.textContent =
                english + " – Tamil Christian Karaoke Song";

            li.appendChild(a);
            ul.appendChild(li);
        });

    } catch (err) {
        console.error("❌ SEO list load failed:", err);
    }
}


/* --------------------------------------------------
   Dynamic Page Title + Meta Description
-------------------------------------------------- */
function applyDynamicSEO() {

    const params = new URLSearchParams(location.search);
    const song = params.get("song");

    if (!song) return;

    // ⭐ Change browser tab title
    document.title =
        song + " Karaoke | Worship The Lord";

    // ⭐ Update meta description
    const meta = document.querySelector(
        'meta[name="description"]'
    );

    if (meta) {
        meta.setAttribute(
            "content",
            "Sing " + song +
            " Tamil Christian karaoke song with lyrics. Worship Jesus using the Worship The Lord app."
        );
    }
}


/* --------------------------------------------------
   Dynamic Song Description (BIG SEO BOOST)
-------------------------------------------------- */
function applySongDescription() {

    const params = new URLSearchParams(location.search);
    const song = params.get("song");

    if (!song) return;

    const box = document.getElementById("songDescription");
    if (!box) return;

    box.innerHTML = `
    <h2>${song} – Tamil Christian Karaoke Song</h2>

    <p>
      Sing <strong>${song}</strong> Tamil Christian worship song using karaoke lyrics
      and music in the Worship The Lord app. This Christian karaoke track helps
      believers praise Jesus during personal prayer, church worship, and fellowship singing.
    </p>

    <p>
      Worship The Lord provides Tamil Christian songs with lyrics, MIDI music,
      adjustable tempo, and worship-friendly playback designed for spiritual devotion
      and practice.
    </p>
  `;
}


/* --------------------------------------------------
   Initialize SEO features
-------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {

    buildSEOSongList();     // build song index
    applyDynamicSEO();      // title + meta update
    applySongDescription(); // ⭐ NEW SEO CONTENT

});