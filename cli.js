#!/usr/bin/env node
// Usage: tamal [file]   — or pipe Malayalam text on stdin.
const fs = require('fs');
const { convert } = require('./extension/tamal');

const arg = process.argv[2];
if (arg === '-h' || arg === '--help') {
  console.log('Usage: tamal [file]    (or pipe text on stdin)\n\n  echo "എന്റെ പേര്" | tamal    # என்றெ பேரு');
  process.exit(0);
}
process.stdout.write(convert(fs.readFileSync(arg || 0, 'utf8')));
