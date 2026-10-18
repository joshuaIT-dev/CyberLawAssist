(() => {
  const root = new URL('../', document.currentScript.src);
  const prefix = 'cla-static:' + root.href + ':';
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', root), { scope: root.href, updateViaCache: 'none' })
        .catch(error => console.warn('CyberLawAssist static cache unavailable:', error.message));
    }, { once: true });
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-clear-cache]');
    if (!button) return;
    const message = document.querySelector('[data-cache-message]');
    button.disabled = true;
    try {
      if (!('caches' in window)) throw new Error('File caching is unavailable in this browser connection.');
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith(prefix)).map(key => caches.delete(key)));
      if (message) message.textContent = 'Cached files cleared. Account records and conversation history were not deleted.';
    } catch (error) {
      if (message) message.textContent = error.message;
    } finally { button.disabled = false; }
  });
})();
