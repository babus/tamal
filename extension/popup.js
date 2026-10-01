(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('input'), output = $('output'), status = $('status');
  const copy = $('copy'), clear = $('clear'), page = $('page');

  const say = (text, ok = false) => { status.textContent = text; status.classList.toggle('ok', ok); };

  function update() {
    output.textContent = Tamal.convert(input.value);
    copy.hidden = clear.hidden = !input.value;
    copy.textContent = 'Copy';
    copy.classList.remove('done');
    say(input.value && !/[ഀ-ൿ]/.test(input.value) ? 'No Malayalam text found' : '');
    // Grow the box with its text, up to the CSS max-height.
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }

  input.addEventListener('input', update);
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  copy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent);
    copy.textContent = 'Copied ✓';
    copy.classList.add('done');
  });

  // The active tab, looked up once so the permission request below runs straight from the click.
  let tab = null, site = null;
  chrome.tabs.query({ active: true, currentWindow: true }).then(async ([t]) => {
    tab = t;
    const url = new URL(t?.url || 'about:blank');
    if (!/^https?:$/.test(url.protocol)) return;
    site = { host: url.hostname, origins: [`*://${url.hostname}/*`] };
    $('auto-host').textContent = site.host;
    $('auto').checked = await chrome.permissions.contains({ origins: site.origins });
    $('auto-row').hidden = false;
  });

  async function convertTab() {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['tamal.js', 'content.js'] });
      const { count } = await chrome.tabs.sendMessage(tab.id, { type: 'page' });
      if (count) say(`✓ Converted ${count} text block${count === 1 ? '' : 's'}. New text converts as it loads.`, true);
      else say('No Malayalam text on this page');
    } catch {
      say("Chrome doesn't let extensions run on this page");
    }
  }

  page.addEventListener('click', async () => {
    page.disabled = true;
    await convertTab();
    page.disabled = false;
  });

  // Granting the site permission is all it takes: background.js registers the script that runs on every load.
  const auto = $('auto');
  auto.addEventListener('change', async () => {
    if (auto.checked) {
      auto.checked = await chrome.permissions.request({ origins: site.origins });
      if (auto.checked) { await convertTab(); say(`✓ ${site.host} now converts on every visit`, true); }
    } else {
      await chrome.permissions.remove({ origins: site.origins });
      say(`${site.host} converts only when you ask. Reload to see the original.`);
    }
  });
})();
