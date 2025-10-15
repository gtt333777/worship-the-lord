

// style: "color:green; font-weight:bold;"        // ✅ bold + green
// style: "color:orange;"                         // ✅ orange, normal
// style: "font-weight:bold;"                     // ✅ bold only
// Notes:
// style is optional — if missing, default formatting is applied.
// You can combine CSS rules: color:green; font-weight:bold; font-style:italic; etc.

// How this works: Each song has its own style string in songNames.js
// updateSongDisplayStyled() reads that style and applies it to the Tamil + English display in #songDisplay.  in songNamesLoader.js
// The file property remains untouched, so all lyrics loading still works normally.
// You can freely change colors, bold, italic, underline, etc., per song.


// song_names.js — master list of song display names (Tamil + transliteration)

// =======================================================
// WorshipApp_Modular/songs_names.js
// Tamil + English song names with optional per-song styles
// =======================================================

window.songNames = [
  { ta: "அப்பா உம் பாதம் அமர்ந்துவிட்டேன்", en: "Appaa um paatham amarnthuvittaen", file: "short_safe_key", style: "color:green; font-weight:bold;" }, // ✅ bold + green

  { ta: "அப்பா பிதாவே அன்பான தேவா", en: "Appa Pithave anbana Deva", file: "short_safe_key" },
  { ta: "அழகாய் திரள் திரளாய்", en: "Azhakaay thiral thiralaay", file: "short_safe_key" },
  { ta: "இயேசு ரத்தமே ரத்தமே ரத்தமே", en: "Yesu raththame raththame raththame", file: "short_safe_key" },
  { ta: "இயேசுவின் பின்னால் நான் செல்வேன்", en: "Yesuvin pinnaal naan selvaen", file: "short_safe_key" },
  { ta: "இரத்தமே சிந்தப்பட்ட இரத்தமே", en: "Rathamae sinthapatta rathamae", file: "short_safe_key" },
  { ta: "இரத்தம் ஜெயம் இரத்தம் ஜெயம்", en: "Raththam jeyam raththam jeyam", file: "short_safe_key" },
  { ta: "உமதுமுகம் நோக்கி", en: "Umathu mugam nokki", file: "short_safe_key" },
  { ta: "உம்மையல்லாமல் எனக்கு யாருண்டு", en: "Ummaiyallaamal enakku yaarunndu", file: "short_safe_key" },
  { ta: "உறைவிடமாய் தெரிந்து கொண்டு", en: "Uraividamaay therinthu konndu", file: "short_safe_key" },
  { ta: "உன்னதரே உம் பாதுகாப்பில்", en: "Unnatharae um paathukkaappil", file: "short_safe_key" },
  { ta: "உன்னதரே என் நேசரே", en: "Unnathare en nesarae", file: "short_safe_key" },
  { ta: "எப்படி நான் பாடுவேன்", en: "Eppadi naan paaduvaen", file: "short_safe_key" },
  { ta: "என் வாழ்க்கையெல்லாம் உம்", en: "En vaalkkaiyellaam um", file: "short_safe_key" },
  { ta: "என்மீது அன்புகூர்ந்து", en: "Enmeethu anbukoornthu", file: "short_safe_key" },
  { ta: "என்னை காண்பவரே", en: "Ennai kaannpavarae", file: "short_safe_key" },
  { ta: "ஐயா உம் திரு நாமம்", en: "Aiyaa um thirunaamam", file: "short_safe_key" },
  { ta: "காக்கும் தெய்வம் இயேசு இருக்க", en: "Kakkum deivam yesu iruka", file: "short_safe_key" },
  { ta: "கிறிஸ்துவுக்குள் என் ஜீவன்", en: "Kiristhuvukkul en jeevan", file: "short_safe_key" },
  { ta: "தளர்ந்து போன கைகளை திடப்படுத்துங்கள்", en: "Thalarnthu pona kaikalai", file: "short_safe_key" },
  { ta: "தேவா உம் சமூகமே", en: "Thaevaa um samookamae", file: "short_safe_key" },
  { ta: "பனி போல பெய்யும் பரிசுத்தரே", en: "Pani pola peyyum parisuththarae", file: "short_safe_key" },
  { ta: "வனாந்திர யாத்திரையில்", en: "Vanandira yatherayil", file: "short_safe_key" },
  { ta: "விண்ணப்பத்தைக் கேட்பவரே", en: "Vinnapathai ketpavare", file: "short_safe_key" },
  { ta: "ஜெப ஆவி ஊற்றுமையா", en: "Jeba aavi oottrumaiyaa", file: "short_safe_key" },
  { ta: "ஜெப ஆவி என்னில் ஊற்றும்", en: "Jeba aavi ennil oottrum Thaevaa", file: "short_safe_key" },
  { ta: "విన్నపాలు విను దైవమా", en: "Vinnapalu vinu Daivamaa", file: "short_safe_key" },
];
