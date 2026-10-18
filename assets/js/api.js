(() => {
  const base = new URL('../php/', document.currentScript.src);
  let csrf = '', accountId = '';
  async function request(file, action, data, query = {}, retried = false) {
    if (location.protocol === 'file:') throw new Error('Open this website through XAMPP at http://localhost/CyberLawAssist/.');
    if (data && !csrf) await request('auth.php', 'me');
    const url = new URL(file, base); url.search = new URLSearchParams({ action, ...query });
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, { method: data ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: { Accept: 'application/json', ...(accountId ? { 'X-CLA-Account': accountId } : {}), ...(data ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}) }, body: data ? JSON.stringify({ ...data, action }) : undefined });
      let result;
      try { result = await response.json(); } catch { throw new Error('The server returned an unexpected response. Check XAMPP and refresh.'); }
      if (result.csrf) csrf = result.csrf;
      if (response.status === 403 && !retried && result.message === 'Your session changed. Refresh the page and try again.') {
        clearTimeout(timer); await request('auth.php', 'me'); return request(file, action, data, query, true);
      }
      if (!response.ok || !result.ok) { const error = new Error(result.message || 'Could not complete the request.'); error.status = response.status; error.payload = result; throw error; }
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The request timed out. Your saved information is safe; please retry.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function download(action, query, filename) {
    const url = new URL('api.php', base); url.search = new URLSearchParams({ action, ...query });
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: accountId ? { 'X-CLA-Account': accountId } : {} });
    if (!response.ok) { const result = await response.json(); const error = new Error(result.message || 'Export failed.'); error.status = response.status; throw error; }
    const blob = await response.blob(), link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  window.CLA = { call: (action, data, query) => request('api.php', action, data, query), auth: (action, data) => request('auth.php', action, data), bindAccount: id => { accountId = id || ''; }, download };
})();
