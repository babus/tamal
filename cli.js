#!/usr/bin/env node
// Usage: tamal [file]   — or pipe Malayalam text on stdin.
//        tamal pdf <file-or-dir> [out-dir] [--ocr auto|force|off] [--pages 1-10] [--tessdata dir]
const fs = require('fs');
const path = require('path');
const { convert } = require('./extension/tamal');

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  console.log(`Usage:
  tamal [file]                          convert text (or pipe it on stdin)
  tamal pdf <file-or-dir> [out-dir]     write <name>.tamil.pdf for each PDF
      --ocr auto|force|off              auto (default) reads scanned and scrambled pages from the page image
      --pages 1-10                      only part of a book
      --tessdata <dir>                  folder with mal.traineddata (default: tessdata/)

  echo "എന്റെ പേര്" | tamal    # என்டெ பேரு
  tamal pdf book.pdf           # → book.tamil.pdf`);
  process.exit(0);
}

if (args[0] === 'pdf') {
  const { convertPath } = require('./pdf');
  const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const ocr = option('--ocr');
  const tessdata = option('--tessdata');
  const [first, last] = (option('--pages') || '').split('-').filter(Boolean).map(Number);
  const [, target, outDir] = args;
  if (!target || (ocr && !['auto', 'force', 'off'].includes(ocr))) {
    console.error('Usage: tamal pdf <file-or-dir> [out-dir] [--ocr auto|force|off] [--pages 1-10] [--tessdata dir]');
    process.exit(1);
  }
  const onProgress = process.stderr.isTTY
    ? (file, done, total) => process.stderr.write(`\r  OCR ${path.basename(file)}: ${done}/${total} pages${done === total ? '\n' : ''}`)
    : undefined;
  convertPath(target, { outDir, ocr, tessdata, first, last: last || first, onProgress }).then((results) => {
    for (const r of results) {
      if (!r.output) { console.log(`✗ ${r.input}: ${r.skipped || r.error}`); continue; }
      const via = r.ocrPages ? `, ${r.ocrPages === r.pages ? 'all' : r.ocrPages} read by OCR` : '';
      console.log(`✓ ${r.input} → ${r.output} (${r.pages} pages${via})`);
      if (r.garbled) console.log(`  ⚠ ${r.garbled} of ${r.pages} pages have scrambled text in the PDF itself, so their output is wrong too.\n    ${r.noOcr ? `OCR would fix them, but there is ${r.noOcr}.` : 'Re-run without --ocr off to read those pages from the image instead.'}`);
    }
    if (!results.length) console.log('No PDFs found.');
    if (results.some((r) => !r.output)) process.exitCode = 1;
  }).catch((e) => { console.error(e.message); process.exit(1); });
} else {
  process.stdout.write(convert(fs.readFileSync(args[0] || 0, 'utf8')));
}
