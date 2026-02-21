// JavaScript source code
console.log("🔎 songSEO.js started");

/* Convert song name into URL-friendly text */
function slugifySong(name) {
  return name.toLowerCase().trim();
}

/* Build visible SEO list */
async function buildSEOSongList() {

  const ul = document.getElementById("seoSongsUL");
  if (!ul) return;

  const res = await fetch("lyrics/songs_names.txt");
  const text = await res.text();

  const lines = text.split("\n").filter(Boolean);

  lines.forEach(line => {

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
}

/* Change page title when song opens */
function applyDynamicSEO() {

  const params = new URLSearchParams(location.search);
  const song = params.get("song");

  if (!song) return;

  document.title =
    song + " Karaoke | Worship The Lord";

  const meta = document.querySelector(
    'meta[name="description"]'
  );

  if (meta) {
    meta.setAttribute(
      "content",
      "Sing " + song +
      " Tamil Christian karaoke song with lyrics in Worship The Lord app."
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  buildSEOSongList();
  applyDynamicSEO();
});