// Tamal: Malayalam → Tamil script. The Malayalam words stay; only the letters change.
// Plain JS with no dependencies, used by the CLI and tests (require) and the extension (window.Tamal).
//
// Tamil has one letter per stop series, so voicing and aspiration are lost:
// ക ഖ ഗ ഘ → க, പ ബ ഭ → ப, and so on. Tamil readers voice stops by position anyway.
(() => {
  const ML = 0x0d00;
  const TA = 0x0b80;

  // Malayalam letters whose Tamil counterpart is not at the same offset in the block.
  const LETTER = {
    'ഖ': 'க', 'ഗ': 'க', 'ഘ': 'க',
    'ഛ': 'ச', 'ഝ': 'ஜ',
    'ഠ': 'ட', 'ഡ': 'ட', 'ഢ': 'ட',
    'ഥ': 'த', 'ദ': 'த', 'ധ': 'த',
    'ബ': 'ப', 'ഭ': 'ப',
    // ഫ is mostly "f" in everyday text (ഫോൺ, ഫുട്ബോൾ); Tamil writes f as ஃப.
    'ഫ': 'ஃப',
    'ഺ': 'ற', 'ഋ': 'ரு', 'ൠ': 'ரூ', 'ഌ': 'லு', 'ൡ': 'லூ',
    'ൃ': '்ரு', 'ൄ': '்ரூ', 'ൢ': '்லு', 'ൣ': '்லூ',
    'ഃ': 'ஃ', 'ഽ': '',
    // Modern Malayalam writes the au sign as ൗ alone (കൗതുകം); Tamil needs the full ௌ.
    'ൗ': 'ௌ',
    // Tamil has ஶ for ശ, but few readers know it; ஷ gives the same "sh" sound (ആശുപത്രി → ஆஷுபத்ரி).
    'ശ': 'ஷ',
    // Chillus (consonant with no vowel) and the old dot reph.
    'ൺ': 'ண்', 'ൻ': 'ன்', 'ർ': 'ர்', 'ൽ': 'ல்', 'ൾ': 'ள்', 'ൿ': 'க்', 'ൔ': 'ம்', 'ൕ': 'ய்', 'ൖ': 'ழ்', 'ൎ': 'ர்',
  };

  // Tamil nasal to use for anusvara (ം) before each class of consonant.
  const NASAL = [
    [/[കഖഗഘ]/, 'ங்'], [/[ചഛജഝ]/, 'ஞ்'], [/[ടഠഡഢ]/, 'ண்'], [/[തഥദധ]/, 'ந்'], [/[പഫബഭ]/, 'ம்'],
  ];

  const VIRAMA = '്';
  const isMl = (ch) => ch >= 'ഀ' && ch <= 'ൿ';
  // Letters that end a syllable's vowel slot: vowel signs, virama, anusvara, visarga.
  const isSign = (ch) => /[ഀ-ഃാ-്ൗൢൣ]/.test(ch);
  const isDigit = (ch) => ch >= '൦' && ch <= '൯';

  // OCR and older text write chillus as consonant + virama + ZWJ (ന്‍).
  const CHILLU = { 'ണ': 'ൺ', 'ന': 'ൻ', 'ര': 'ർ', 'ല': 'ൽ', 'ള': 'ൾ', 'ക': 'ൿ' };
  const normalize = (s) => s
    .replace(/([ണനരലളക])്‍/g, (_, c) => CHILLU[c])
    .replace(/[‌‍]/g, '')
    .replace(/ു്/g, 'ു') // old spelling of the half-u: അതു് = അത്
    .replace(/\u0D46\u0D57/g, '\u0D4C') // au typed as two parts (െ + ൗ) → ൌ
    .replace(/ശ്രീ/g, 'സ്രീ') // Tamil writes Sri as ஸ்ரீ, not ஷ்ரீ
    // Double letters Tamil readers would stumble on get the usual Tamil spelling:
    .replace(/ങ്ങ/g, 'ങ്ക') // ங்க, not ங்ங (ഇറങ്ങി → இறங்கி)
    .replace(/ഞ്ഞ/g, 'ഞ്ച') // ஞ்ச, not ஞ்ஞ (കുഞ്ഞ് → குஞ்சு)
    .replace(/റ്റ/g, 'ട്ട') // ட்ட, the "tt" sound, not ற்ற (ടിക്കറ്റ് → டிக்கட்டு)
    .replace(/(?:ന്|ൻ)റ/g, 'ന്ട'); // ன்ட, the "nt" sound, not ன்ற (എന്റെ → என்டெ); ൻറ is an older spelling

  function convert(input) {
    const s = normalize(input);
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (!isMl(ch)) { out += ch; continue; }
      const prev = s[i - 1] || '';
      const next = s[i + 1] || '';

      if (isDigit(ch)) { out += String(ch.charCodeAt(0) - 0x0d66); continue; }

      if (ch === 'ന') {
        // Tamil splits Malayalam ന: ந starts a word and goes before dentals (ന്ത → ந்த),
        // ன is used everywhere else (എന്ന → என்ன, അവന് → அவனு).
        const dental = next === VIRAMA && /[തഥദധ]/.test(s[i + 2] || '');
        out += !isMl(prev) || dental ? 'ந' : 'ன';
        continue;
      }

      if (ch === 'ം') {
        const nasal = NASAL.find(([re]) => re.test(next));
        out += nasal ? nasal[1] : 'ம்';
        continue;
      }

      // Word-final virama is the half-u (samvruthokaram): അത് is "athu", written அது.
      if (ch === VIRAMA && !isMl(next) && !isSign(prev)) { out += 'ு'; continue; }

      if (LETTER[ch] !== undefined) { out += LETTER[ch]; continue; }
      // Vowels, consonants and vowel signs sit at the same offsets in both blocks.
      const code = ch.charCodeAt(0);
      out += (code >= 0x0d05 && code <= 0x0d39) || (code >= 0x0d3e && code <= 0x0d4d) ? String.fromCharCode(code - ML + TA) : ch;
    }
    return out;
  }

  const api = { convert };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.Tamal = api;
})();
