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

  page.addEventListener('click', async () => {
    page.disabled = true;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['tamal.js', 'content.js'] });
      const { count } = await chrome.tabs.sendMessage(tab.id, { type: 'page' });
      if (count) say(`✓ Converted ${count} text block${count === 1 ? '' : 's'}. New text converts as it loads.`, true);
      else say('No Malayalam text on this page');
    } catch {
      say("Chrome doesn't let extensions run on this page");
    }
    page.disabled = false;
  });
})();
