(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('input'), output = $('output'), status = $('status');

  input.addEventListener('input', () => {
    output.value = Tamal.convert(input.value);
    status.textContent = input.value && !/[ഀ-ൿ]/.test(input.value) ? 'No Malayalam text found' : '';
  });
  $('copy').addEventListener('click', async () => { await navigator.clipboard.writeText(output.value); status.textContent = 'Copied'; });

  $('page').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['tamal.js', 'content.js'] });
      const { count } = await chrome.tabs.sendMessage(tab.id, { type: 'page' });
      status.textContent = count ? `Converted ${count} text blocks` : 'No Malayalam text on this page';
    } catch {
      status.textContent = "Can't run on this page";
    }
  });
})();
