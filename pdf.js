// Convert Malayalam PDFs into Tamil-script PDFs, page by page.
// Text is pulled with poppler's `pdftotext`. Pages whose text layer is empty (scans) or
// scrambled (e.g. Word + Kartika exports with a broken ToUnicode map) are read with
// Tesseract OCR instead. The converted text is re-typeset as plain reflowed text and
// printed by headless Chrome, which shapes Tamil properly. The original layout, page
// breaks and images are not kept; each source page's number is shown in the margin.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, execFileSync, spawn } = require('child_process');
const { promisify } = require('util');
const { convert } = require('./extension/tamal');

const run = promisify(execFile);
const TESSDATA = path.join(__dirname, 'tessdata');
const CHROME = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find((p) => p && fs.existsSync(p));

const MALAYALAM = /[ഀ-ൿ]/g;
// A vowel sign or virama with no consonant before it (the second half of a two-part
// vowel and the ു് spelling are fine). Real text has these on ~0-1% of letters; a
// broken font map has them on ~10%.
const BAD_SEQ = /(^|[^ക-ഹൺ-ൿുെേ‌‍])[ാ-്ൗ]/gmu;
const BAD_RATIO = 0.03;

function pageNeedsOcr(text) {
  const n = (text.match(MALAYALAM) || []).length;
  if (n < 20) return !text.trim(); // empty page → probably an image
  return (text.match(BAD_SEQ) || []).length / n > BAD_RATIO;
}

function extractPages(file, first, last) {
  const range = [...(first ? ['-f', String(first)] : []), ...(last ? ['-l', String(last)] : [])];
  let text;
  try {
    text = execFileSync('pdftotext', ['-enc', 'UTF-8', ...range, file, '-'], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('Needs pdftotext from poppler (brew install poppler)');
    throw new Error(String(e.stderr || e.message).trim());
  }
  const pages = text.split('\f');
  if (pages.length > 1 && !pages[pages.length - 1].trim()) pages.pop();
  return pages;
}

function hasNativeTesseract() {
  try { execFileSync('tesseract', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

function hasTesseractJs() {
  try { require.resolve('tesseract.js'); return true; } catch { return false; }
}

// Why OCR can't run, or null when it can.
function ocrUnavailable(dir) {
  if (!fs.existsSync(path.join(dir, 'mal.traineddata'))) return `no Malayalam OCR model at ${path.join(dir, 'mal.traineddata')} (run: make tessdata)`;
  if (!hasNativeTesseract() && !hasTesseractJs()) return 'no OCR engine (run: npm install, or brew install tesseract)';
  return null;
}

async function renderPage(file, pageNo, dir) {
  const img = path.join(dir, `p${pageNo}`);
  await run('pdftoppm', ['-f', String(pageNo), '-l', String(pageNo), '-r', '300', '-gray', '-singlefile', '-png', file, img]);
  return `${img}.png`;
}

async function pool(items, limit, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// OCR the given 1-based page numbers. Uses native Tesseract when installed (faster),
// otherwise tesseract.js (WebAssembly). Returns { pageNo: text }.
async function ocrPages(file, pageNos, dir, onProgress) {
  const langs = ['mal', 'eng'].filter((l) => fs.existsSync(path.join(dir, `${l}.traineddata`)));
  const workers = Math.max(1, Math.min(8, os.cpus().length - 2, pageNos.length));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tamal-ocr-'));
  const out = {};
  let done = 0;
  let scheduler = null;
  try {
    let recognize;
    if (hasNativeTesseract()) {
      recognize = async (img) => (await run('tesseract', [img, 'stdout', '--tessdata-dir', dir, '-l', langs.join('+'), '--psm', '3'],
        { maxBuffer: 1 << 26, env: { ...process.env, OMP_THREAD_LIMIT: '1' } })).stdout;
    } else {
      const { createWorker, createScheduler } = require('tesseract.js');
      scheduler = createScheduler();
      const cachePath = path.join(tmp, 'cache');
      await Promise.all(Array.from({ length: workers }, async () => {
        const worker = await createWorker(langs, 1, { langPath: dir, gzip: false, cachePath });
        await worker.setParameters({ tessedit_pageseg_mode: '3' });
        scheduler.addWorker(worker);
      }));
      recognize = async (img) => (await scheduler.addJob('recognize', img)).data.text;
    }
    await pool(pageNos, workers, async (pageNo) => {
      const img = await renderPage(file, pageNo, tmp);
      out[pageNo] = await recognize(img);
      fs.rmSync(img, { force: true });
      onProgress?.(++done, pageNos.length);
    });
    return out;
  } finally {
    if (scheduler) await scheduler.terminate();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// A PDF page's text comes as one line per printed line. Join the lines of a paragraph
// so they can re-wrap: a line about as long as the longest one runs on into the next,
// a shorter one ends there. Returns paragraphs, each a list of lines.
function paragraphs(text) {
  const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim());
  const longest = Math.max(0, ...lines.map((l) => l.length));
  const full = longest >= 40 ? longest * 0.75 : Infinity;
  const paras = [];
  let para = null;
  let open = false; // the last line of `para` runs on
  for (const line of lines) {
    if (!line) { para = null; open = false; continue; }
    if (!para) paras.push(para = []);
    if (open) para[para.length - 1] += ` ${line}`; else para.push(line);
    open = line.length >= full;
  }
  return paras;
}

// Running headers and footers: a first or last line that repeats (page numbers aside)
// on at least half the pages. Returns the pages without them.
function stripRunningLines(pages) {
  if (pages.length < 4) return pages;
  const key = (l) => l.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const edges = (lines) => {
    const filled = lines.map((l, i) => (l.trim() ? i : -1)).filter((i) => i >= 0);
    return [...new Set([...filled.slice(0, 2), ...filled.slice(-2)])];
  };
  const split = pages.map((p) => p.split('\n'));
  const seen = new Map();
  for (const lines of split) for (const k of new Set(edges(lines).map((i) => key(lines[i])))) seen.set(k, (seen.get(k) || 0) + 1);
  return split.map((lines) => {
    const drop = new Set(edges(lines).filter((i) => seen.get(key(lines[i])) >= pages.length / 2));
    return lines.filter((_, i) => !drop.has(i)).join('\n');
  });
}

const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function toHtml(title, pages, first) {
  const body = stripRunningLines(pages).map((text, i) => {
    const paras = paragraphs(text).map((p) => `<p>${p.map((l) => escapeHtml(convert(l))).join('<br>')}</p>`).join('\n');
    return `<section><div class="n">${first + i}</div>\n${paras}\n</section>`;
  }).join('\n');
  return `<!doctype html>
<html lang="ta">
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 22mm 18mm 22mm 10mm; }
  body { margin: 0 0 0 14mm; font: 13pt/1.75 "Tamil MN", "Noto Serif Tamil", "Noto Sans Tamil", "Tamil Sangam MN", "Latha", serif; color: #111; }
  /* The source page number, in the left margin where that page's text starts. */
  .n { float: left; width: 10mm; margin-left: -14mm; text-align: right; font: 8pt/2.85 sans-serif; color: #999; }
  p { margin: 0 0 0.7em; orphans: 2; widows: 2; }
</style>
${body}
</html>
`;
}

// Headless Chrome can linger after writing the file, so stop it once it reports the write.
function printPdf(html, out) {
  if (!CHROME) throw new Error('Needs Google Chrome, Chromium or Brave (or set CHROME=/path/to/browser)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tamal-pdf-'));
  const src = path.join(tmp, 'book.html');
  fs.writeFileSync(src, html);
  fs.rmSync(out, { force: true });
  const args = ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${path.join(tmp, 'profile')}`,
    '--no-pdf-header-footer', `--print-to-pdf=${out}`, `file://${src}`];
  return new Promise((resolve, reject) => {
    const chrome = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'], detached: true });
    let log = '';
    const timer = setTimeout(() => { try { process.kill(-chrome.pid); } catch {} }, 300000);
    chrome.stderr.on('data', (d) => {
      log += d;
      if (/written to file/i.test(log)) try { process.kill(-chrome.pid); } catch {}
    });
    chrome.on('error', reject);
    chrome.on('exit', () => {
      clearTimeout(timer);
      fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
      if (fs.existsSync(out)) resolve(); else reject(new Error(`Chrome wrote no PDF:\n${log.slice(-500)}`));
    });
  });
}

// ocr: 'auto' reads scanned and scrambled pages from the page image, 'force' reads every
// page that way, 'off' never does.
async function convertFile(input, output, { ocr = 'auto', tessdata = TESSDATA, first = 1, last, onProgress } = {}) {
  const pages = extractPages(input, first, last);
  const wanted = ocr === 'off' ? [] : pages.map((p, i) => (ocr === 'force' || pageNeedsOcr(p) ? i : -1)).filter((i) => i >= 0);
  const noOcr = wanted.length ? ocrUnavailable(tessdata) : null;
  if (noOcr && ocr === 'force') throw new Error(`Can't OCR: ${noOcr}`);
  const toOcr = noOcr ? [] : wanted;
  if (toOcr.length) {
    const texts = await ocrPages(input, toOcr.map((i) => first + i), tessdata, onProgress);
    for (const i of toOcr) pages[i] = texts[first + i];
  }
  if (!pages.some((p) => p.match(MALAYALAM))) {
    return { input, skipped: noOcr ? `no Malayalam text in the PDF, and can't OCR: ${noOcr}` : 'no Malayalam text found' };
  }

  const title = `${path.basename(input, path.extname(input))} (Malayalam in Tamil script)`;
  await printPdf(toHtml(title, pages, first), output);
  const garbled = toOcr.length ? 0 : pages.filter((p) => pageNeedsOcr(p)).length;
  return { input, output, pages: pages.length, ocrPages: toOcr.length, garbled, noOcr };
}

// Accepts a single PDF or a directory of PDFs (non-recursive). Output goes to outDir,
// or next to each input.
async function convertPath(target, { outDir, ...options } = {}) {
  const stat = fs.statSync(target);
  const files = stat.isDirectory()
    ? fs.readdirSync(target).filter((f) => /\.pdf$/i.test(f) && !/\.tamil\.pdf$/i.test(f)).sort().map((f) => path.join(target, f))
    : [target];
  const dest = path.resolve(outDir || (stat.isDirectory() ? target : path.dirname(target)));
  fs.mkdirSync(dest, { recursive: true });

  const results = [];
  for (const file of files) {
    const out = path.join(dest, `${path.basename(file, path.extname(file))}.tamil.pdf`);
    try {
      results.push(await convertFile(file, out, { ...options, onProgress: options.onProgress && ((d, t) => options.onProgress(file, d, t)) }));
    } catch (e) {
      results.push({ input: file, error: e.message });
    }
  }
  return results;
}

module.exports = { convertPath, convertFile, pageNeedsOcr, paragraphs, stripRunningLines };
