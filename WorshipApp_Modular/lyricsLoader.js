// WorshipApp_Modular/lyricsLoader.js
/*
async function loadLyricsForSelectedSong(selectElement) {
  if (!selectElement) {
    console.error("❌ No select element provided.");
    return;
  }

  const tamilName = selectElement.value;
  if (!tamilName) {
    console.warn("⚠️ No song selected.");
    return;
  }

  const filename = `lyrics/${tamilName}.txt`;

  console.log(`🎵 Selected Tamil name: ${tamilName}`);
  console.log(`📄 Attempting to load lyrics from: ${filename}`);

  const lyricsBox = document.getElementById("lyricsArea");
  if (!lyricsBox) {
    console.error("❌ 'lyricsArea' textarea not found in HTML.");
    return;
  }

  try {
    const response = await fetch(filename);
    if (!response.ok) throw new Error(`Lyrics file not found: ${filename}`);

    const text = await response.text();
    lyricsBox.value = text;
    console.log("✅ Lyrics loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading lyrics:", err.message);
    lyricsBox.value = "Lyrics not found.";
  }
}

*/




//Dynamically injects <script src="lyrics/<key>.js"> and displays registered lyrics. No modules, uses globals.
// WorshipApp_Modular/lyricsLoader.js
// Loads lyrics files as plain <script> and reads window.SONG_LYRICS[key]

window._loadedSongScripts = window._loadedSongScripts || {};   // key => "loading"|"loaded"|"error"
window._songLoadCallbacks = window._songLoadCallbacks || {};   // key => [callbacks]

function _setLyricsText(elem, text) {
  if (!elem) return;
  if (elem.tagName === "TEXTAREA" || elem.tagName === "INPUT") elem.value = text;
  else elem.textContent = text;
}

function loadLyricsForSelectedSong(selectElement) {
  if (!selectElement) {
    console.error("❌ No select element provided.");
    return;
  }

  const key = selectElement.value;
  const lyricsBox = document.getElementById("lyricsArea");
  if (!lyricsBox) {
    console.error("❌ #lyricsArea not found.");
    return;
  }

  if (!key) {
    _setLyricsText(lyricsBox, "Please select a song.");
    return;
  }

  // If lyrics already registered, show immediately
  if (window.SONG_LYRICS && window.SONG_LYRICS[key]) {
    _setLyricsText(lyricsBox, window.SONG_LYRICS[key]);
    console.log(`✅ Displayed cached lyrics for: ${key}`);
    return;
  }

  // If a load is already in progress, queue callback
  if (window._loadedSongScripts[key] === "loading") {
    _setLyricsText(lyricsBox, "Loading lyrics...");
    window._songLoadCallbacks[key] = window._songLoadCallbacks[key] || [];
    window._songLoadCallbacks[key].push(() => {
      if (window.SONG_LYRICS && window.SONG_LYRICS[key]) _setLyricsText(lyricsBox, window.SONG_LYRICS[key]);
      else _setLyricsText(lyricsBox, "Lyrics not found after load.");
    });
    return;
  }

  // Start loading the <script>
  const scriptUrl = `lyrics/${key}.js`;
  _setLyricsText(lyricsBox, "Loading lyrics...");
  window._loadedSongScripts[key] = "loading";
  window._songLoadCallbacks[key] = window._songLoadCallbacks[key] || [];

  // queue immediate display when script finishes
  window._songLoadCallbacks[key].push(() => {
    if (window.SONG_LYRICS && window.SONG_LYRICS[key]) {
      _setLyricsText(lyricsBox, window.SONG_LYRICS[key]);
      console.log(`✅ Loaded and displayed lyrics for: ${key}`);
    } else {
      _setLyricsText(lyricsBox, "Lyrics file loaded but content missing.");
      console.warn(`⚠️ ${scriptUrl} loaded but did not register SONG_LYRICS["${key}"]`);
    }
  });

  const script = document.createElement("script");
  script.src = scriptUrl;
  script.async = true;

  script.onload = () => {
    window._loadedSongScripts[key] = "loaded";
    const callbacks = window._songLoadCallbacks[key] || [];
    callbacks.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
    // clear callbacks after running
    delete window._songLoadCallbacks[key];
  };

  /*
  script.onerror = () => {
    window._loadedSongScripts[key] = "error";
    _setLyricsText(lyricsBox, "Failed to load lyrics file.");
    console.error(`❌ Failed to load ${scriptUrl}`);
    // run callbacks with error message
    const callbacks = window._songLoadCallbacks[key] || [];
    callbacks.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
    delete window._songLoadCallbacks[key];
  };

  document.head.appendChild(script);
}
*/


//Perfect — your lyricsLoader.js already handles .js files elegantly.
//We just need to extend the script.onerror block so that if the .js file is
//missing, it automatically fetches the corresponding .txt file and displays it.

  script.onerror = () => {
    console.warn(`⚠️ JS lyrics not found for ${key}, trying TXT...`);
    const txtUrl = `lyrics/${key}.txt`;

    fetch(txtUrl)
      .then(res => {
        if (!res.ok) throw new Error("TXT not found");
        return res.text();
      })
      .then(text => {

      window.SONG_LYRICS = window.SONG_LYRICS || {};
      window.SONG_LYRICS[key] = text;


        _setLyricsText(lyricsBox, text);
        console.log(`✅ Loaded TXT lyrics for: ${key}`);
      })
      .catch(() => {
        _setLyricsText(lyricsBox, "❌ Lyrics file not found (.js or .txt).");
        console.error(`❌ Neither ${scriptUrl} nor ${txtUrl} found.`);
      })
      .finally(() => {
        window._loadedSongScripts[key] = "error";
        const callbacks = window._songLoadCallbacks[key] || [];
        callbacks.forEach(cb => {
          try { cb(); } catch (e) { console.error(e); }
        });
        delete window._songLoadCallbacks[key];
      });
  };

    // ✅ Important: Append the script so .js file can actually load
  document.head.appendChild(script);
}