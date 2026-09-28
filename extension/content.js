// Injected on demand. Handles "convert page" and "show selection" requests.
(() => {
  if (window.__tamalReady) return;
  window.__tamalReady = true;

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);
  const MALAYALAM = /[ഀ-ൿ]/;

  function convertNode(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (MALAYALAM.test(n.nodeValue) && !SKIP.has(n.parentNode?.nodeName) && !n.parentNode?.isContentEditable
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) n.nodeValue = Tamal.convert(n.nodeValue);
    return nodes.length;
  }

  let observer = null;
  function convertPage() {
    const count = convertNode(document.body);
    // Keep converting content that loads later (infinite scroll, SPAs).
    if (!observer) {
      observer = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === 'characterData' && MALAYALAM.test(m.target.nodeValue)) convertNode(m.target.parentNode);
          for (const added of m.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE ? MALAYALAM.test(added.nodeValue) : added.nodeType === Node.ELEMENT_NODE) {
              convertNode(added.nodeType === Node.TEXT_NODE ? added.parentNode : added);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    return count;
  }

  function showSelection(text) {
    document.getElementById('tamal-pop')?.remove();
    const output = Tamal.convert(text);
    const host = document.createElement('div');
    host.id = 'tamal-pop';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        .box { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; width: min(440px, calc(100vw - 32px));
          max-height: 50vh; display: flex; flex-direction: column; background: #fff; color: #1d1c1a;
          border: 1px solid #e2dfd7; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.18);
          font: 16px/1.6 "Tamil Sangam MN", "Noto Sans Tamil", "Latha", system-ui, sans-serif; }
        @media (prefers-color-scheme: dark) { .box { background: #1f1f1d; color: #ecebe6; border-color: #33322f; } }
        .top { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgba(128,128,128,.25);
          font: 12px system-ui, -apple-system, sans-serif; opacity: .8; }
        .top span { margin-right: auto; }
        button { font: inherit; padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(128,128,128,.4); background: transparent; color: inherit; cursor: pointer; }
        .text { padding: 12px; overflow: auto; white-space: pre-wrap; }
      </style>
      <div class="box"><div class="top"><span>Tamal</span><button id="copy">Copy</button><button id="close">✕</button></div>
      <div class="text" lang="ta"></div></div>`;
    shadow.querySelector('.text').textContent = output;
    shadow.getElementById('close').onclick = () => host.remove();
    shadow.getElementById('copy').onclick = (e) => { navigator.clipboard.writeText(output); e.target.textContent = 'Copied'; };
    document.documentElement.appendChild(host);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'page') reply({ count: convertPage() });
    if (msg.type === 'selection') { showSelection(msg.text); reply({}); }
  });
})();
