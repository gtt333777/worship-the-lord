// WorshipApp_Modular/songNamesLoader.js
console.log("🎵 songNamesLoader.js: Starting (Cloudflare R2 mode)...");

const R2_BASE_URL = "https://pub-c84190e6ff024cb9876d50ae10614e90.r2.dev/";

async function loadSongNames() {
  const select = document.getElementById("songSelect");
  if (!select) {
    console.error("❌ songNamesLoader.js: #songSelect not found.");
    return;
  }

  try {
    console.log("📂 Fetching lyrics/songs_names.txt...");
    const res = await fetch("lyrics/songs_names.txt");
    if (!res.ok) throw new Error("songs_names.txt not found");

    const text = await res.text();
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("//"));

    select.innerHTML = "";
    window.songURLs = {}; // 🔁 Global song map

    // --- Helper: find star level (from window.star) ---
    function getStarLevel(songName) {
      if (!window.star) return null;
      for (const s of window.star) {
        const trimmed = s.trim();
        let level = null;
        let clean = trimmed;

        if (trimmed.startsWith("***")) {
          level = 3; clean = trimmed.replace(/^\*\*\*\s*/, "");
        } else if (trimmed.startsWith("**")) {
          level = 2; clean = trimmed.replace(/^\*\*\s*/, "");
        } else if (trimmed.startsWith("*")) {
          level = 1; clean = trimmed.replace(/^\*\s*/, "");
        } else if (trimmed.startsWith("#")) {
          level = 0; clean = trimmed.replace(/^#\s*/, "");
        }

        if (clean === songName) return level;
      }
      return null;
    }

    // --- Process each line (Tamil + English name) ---
    lines.forEach((line, i) => {
      const songName = line.trim();
      const encoded = encodeURIComponent(songName);

      const vocalURL = `${R2_BASE_URL}${encoded}_vocal.mp3`;
      const accURL = `${R2_BASE_URL}${encoded}_acc.mp3`;

      window.songURLs[songName] = { vocalURL, accURL };

      const opt = document.createElement("option");
      opt.value = songName;

      // ⭐ Apply style
      const level = getStarLevel(songName);
      if (level === 3) {
        opt.textContent = "★★★ " + songName;
        opt.style.color = "#27ae60";
        opt.style.fontWeight = "bold";
      } else if (level === 2) {
        opt.textContent = "★★ " + songName;
        opt.style.color = "orange";
        opt.style.fontWeight = "bold";
      } else if (level === 1) {
        opt.textContent = "★ " + songName;
        opt.style.color = "black";
        opt.style.fontWeight = "bold";
      } else if (level === 0) {
        opt.textContent = "# " + songName;
        opt.style.color = "gray";
        opt.style.fontWeight = "bold";
      } else {
        opt.textContent = songName;
      }

      select.appendChild(opt);

      console.log(`✅ [${i + 1}] ${songName}`);
      console.log(`   🎤 Vocal: ${vocalURL}`);
      console.log(`   🎸 Acc  : ${accURL}`);
    });

    console.log(`✅ ${lines.length} songs loaded from R2 with bilingual names.`);
  } catch (err) {
    console.error("❌ songNamesLoader.js: Error loading song names:", err);
  }
}

window.addEventListener("DOMContentLoaded", loadSongNames);
