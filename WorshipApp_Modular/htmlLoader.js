// WorshipApp_Modular/htmlLoader.js
async function loadHtmlParts() {
  const parts = [
    { id: "part1-head", file: "WorshipApp_Modular/htmlPart1_head.html" },
    { id: "part2-controls", file: "WorshipApp_Modular/htmlPart2_controls.html" },
    { id: "part3-loop-script", file: "WorshipApp_Modular/htmlPart3_scriptLoopInit.html" },
    { id: "part4-service-worker", file: "WorshipApp_Modular/htmlPart4_serviceWorker.html" },
    { id: "part5-audio", file: "WorshipApp_Modular/htmlPart5_audioElements.html" }
  ];

  for (const part of parts) {
    const el = document.getElementById(part.id);
    if (el) {
      try {
        const res = await fetch(part.file);
        const html = await res.text();
        el.innerHTML = html;
      } catch (e) {
        console.error("Failed to load:", part.file, e);
        el.innerHTML = `<div style="color:red;">⚠️ Failed to load ${part.file}</div>`;
      }
    }
  }
}
window.addEventListener("DOMContentLoaded", loadHtmlParts);
