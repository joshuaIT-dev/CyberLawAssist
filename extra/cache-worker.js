const ROOT = self.registration.scope;
const PREFIX = 'cla-static:' + ROOT + ':';
const CACHE = PREFIX + 'v4';
const FILES = [
  'assets/css/site.css', 'responsiveness/mobile.css', 'responsiveness/portal.css',
  'assets/js/api.js', 'assets/js/site.js', 'assets/js/portal.js', 'assets/js/portal-language.js',
  'extra/loading.css', 'extra/loading.js', 'extra/cache.js', 'extra/legal.css',
  'extra/404.css', 'extra/offline.html', 'pages/terms.html', 'pages/privacy.html'
];
const ALLOWED = new Set(FILES.map(path => new URL(path, ROOT).href));
const OFFLINE = new URL('extra/offline.html', ROOT).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of FILES) {
      const url = new URL(path, ROOT).href;
      const response = await fetch(url, { credentials: 'omit', cache: 'reload' });
      if (!response.ok) throw new Error('Could not cache ' + path);
      await cache.put(url, response);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
async function publicFile(request, key) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.headers.get('Cache-Control')?.includes('no-store')) {
      try { await (await caches.open(CACHE)).put(key, response.clone()); } catch { /* A full cache must not block the page. */ }
    }
    return response;
  } catch (error) {
    const cached = await caches.match(key, { cacheName: CACHE });
    if (cached) return cached;
    throw error;
  }
}
async function offlinePage() {
  const cached = await caches.match(OFFLINE, { cacheName: CACHE });
  return new Response(cached ? await cached.text() : 'CyberLawAssist is unavailable. Reconnect to the local server and reload.', {
    status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const key = new URL(url.pathname, url.origin).href;
  if (ALLOWED.has(key)) {
    event.respondWith(publicFile(request, key).catch(() => request.mode === 'navigate' ? offlinePage() : Response.error()));
  } else if (request.mode === 'navigate') {
    // Protected pages always reach PHP; only a public error page is available offline.
    event.respondWith(fetch(request).catch(offlinePage));
  }
});
