// Run with `npm test`. Each case is Malayalam → expected Tamil-script output.
const assert = require('assert');
const { convert } = require('./extension/tamal');
const { pageNeedsOcr, paragraphs, stripRunningLines } = require('./pdf');

const CASES = [
  ['എന്റെ പേര് ബാബു', 'என்டெ பேரு பாபு'], // ന്റ → ன்ட, word-final ് → ு
  ['അവൻ വന്നു', 'அவன் வன்னு'], // chillu ൻ, ന്ന → ன்ன
  ['അവന്‍', 'அவன்'], // old chillu spelling with ZWJ
  ['അതു്', 'அது'], // old half-u spelling
  ['നമസ്കാരം', 'நமஸ்காரம்'], // word-initial ന → ந
  ['പന്ത്', 'பந்து'], // ന before ത → ந
  ['ഇന്ത്യ', 'இந்த்ய'],
  ['സംഗീതം', 'ஸங்கீதம்'], // anusvara before a velar → ங்
  ['ഭാരതം', 'பாரதம்'], // voiced/aspirated stops collapse
  ['കൃഷ്ണൻ', 'க்ருஷ்ணன்'], // vowel sign ൃ → ்ரு
  ['ശ്രീ ശിവൻ', 'ஸ்ரீ ஷிவன்'], // Sri is written ஸ்ரீ in Tamil, other ശ as ஷ
  ['ആശുപത്രിയിൽ', 'ஆஷுபத்ரியில்'],
  ['പുറത്തിറങ്ങരുതെന്ന്', 'புறத்திறங்கருதென்னு'], // ങ്ങ → ங்க
  ['കുഞ്ഞ് പറഞ്ഞു', 'குஞ்சு பறஞ்சு'], // ഞ്ഞ → ஞ்ச
  ['ടിക്കറ്റ് ഒറ്റ', 'டிக்கட்டு ஒட்ட'], // റ്റ → ட்ட
  ['അപ്പാർട്ട്മെന്റിന്റെ അവൻറെ', 'அப்பார்ட்ட்மென்டின்டெ அவன்டெ'], // ന്റ and old ൻറ → ன்ட
  ['എൻറ്റെ എന്‍റ്റെ', 'என்டெ என்டெ'], // informal ൻറ്റ spelling of ന്റ, also as OCR writes it
  ['തൻ്റെ എൻ്റെ', 'தன்டெ என்டெ'], // ൻ്റ, the Unicode 6+ spelling of ന്റ
  ['സംഗീതം തുടങ്ങുന്നു', 'ஸங்கீதம் துடங்குன்னு'],
  ['ദുഃഖം', 'துஃகம்'],
  ['പൊന്നോണം', 'பொன்னோணம்'], // two-part vowel signs
  ['ഒരു ഓർമ്മ', 'ஒரு ஓர்ம்ம'],
  ['കൗതുകം കൌതുകം', 'கௌதுகம் கௌதுகம்'], // both spellings of the au sign
  ['ഫോൺ', 'ஃபோண்'], // ഫ → ஃப
  ['൧൨൩', '123'],
  ['Hello, കേരളം!', 'Hello, கேரளம்!'], // non-Malayalam text is left alone
];

// PDF text handling (pdf.js); the PDF reading and writing themselves need poppler and Chrome.
const long = 'അവിടെ നല്ല രസമായിരുന്നു ചെറിയമ്മയും ഉണ്ണി കുട്ടനും ആടും';
const PDF_CASES = [
  ['real text is kept', () => pageNeedsOcr(`${long}\n${long}`), false],
  ['vowel signs with no consonant mean a broken font map', () => pageNeedsOcr('െൃതയതയുള്ള െോല്ോവസ്ഥയും ഒന്നക്കയോണ് െഴിയും െുട്ടി'), true],
  ['an empty page is a scan', () => pageNeedsOcr(' \n'), true],
  ['full lines run on, a short line ends there, a blank line ends the paragraph',
    () => paragraphs(`${long}\n${long}\nപോയി\nവന്നു\n\n${long}`), [[`${long} ${long} പോയി`, 'വന്നു'], [long]]],
  ['short lines stay as they are', () => paragraphs('ഒന്ന്\nരണ്ട്'), [['ഒന്ന്', 'രണ്ട്']]],
  ['running headers and footers are dropped',
    () => stripRunningLines(['ഒന്ന്', 'രണ്ട്', 'മൂന്ന്', 'നാല്'].map((w, i) => `My Book | Author\n${w}\n${long}\n${w}\nPage ${i + 1}`)).map((p) => p.split('\n').length), [3, 3, 3, 3]],
];

let failed = 0;
for (const [ml, ta] of CASES) {
  try {
    assert.strictEqual(convert(ml), ta);
  } catch {
    failed++;
    console.error(`✗ ${ml} → ${convert(ml)} (expected ${ta})`);
  }
}
for (const [name, run, expected] of PDF_CASES) {
  try {
    assert.deepStrictEqual(run(), expected);
  } catch {
    failed++;
    console.error(`✗ pdf: ${name} → ${JSON.stringify(run())}`);
  }
}
const total = CASES.length + PDF_CASES.length;
console.log(`${total - failed}/${total} passed`);
process.exitCode = failed ? 1 : 0;
