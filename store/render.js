#!/usr/bin/env node
// Renders store/src/*.html to store/*.png at the size in each page's <html data-size="WxH">.
// Needs Google Chrome, Chromium or Brave (or CHROME=/path/to/browser).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find((p) => p && fs.existsSync(p));

// Headless Chrome can linger after writing the file, so stop it once it reports the write.
function screenshot(src, out, size) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tamal-'));
  const args = ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--blink-settings=preferredColorScheme=1',
    '--force-device-scale-factor=1', '--allow-file-access-from-files', `--user-data-dir=${profile}`,
    `--window-size=${size.replace('x', ',')}`, '--virtual-time-budget=2000', `--screenshot=${out}`, `file://${src}`];
  return new Promise((resolve, reject) => {
    const chrome = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'], detached: true });
    let log = '';
    const timer = setTimeout(() => { try { process.kill(-chrome.pid); } catch {} }, 60000);
    chrome.stderr.on('data', (d) => {
      log += d;
      if (/written to file/i.test(log)) try { process.kill(-chrome.pid); } catch {}
    });
    chrome.on('error', reject);
    chrome.on('exit', () => {
      clearTimeout(timer);
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
      if (fs.existsSync(out)) resolve(); else reject(new Error(`No screenshot for ${src}:\n${log.slice(-500)}`));
    });
  });
}

(async () => {
  if (!CHROME) throw new Error('Needs Google Chrome, Chromium or Brave (or set CHROME=/path/to/browser)');
  const dir = path.join(__dirname, 'src');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const src = path.join(dir, file);
    const size = fs.readFileSync(src, 'utf8').match(/data-size="(\d+x\d+)"/)[1];
    const out = path.join(__dirname, file.replace(/\.html$/, '.png'));
    fs.rmSync(out, { force: true });
    await screenshot(src, out, size);
    console.log(`${path.relative(process.cwd(), out)} (${size})`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
