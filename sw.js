/* Game Load service worker: makes the app open offline.
   Strategy: answer from the cache at once (fast, works with no signal), then refresh the cache
   from the network in the background. A new version is used the next time the app is opened.
   Data is NOT here: games, roster and settings live in the device database (IndexedDB). */
const CACHE = 'game-load-2.5.6';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, {ignoreSearch: true});
    const net = fetch(req).then(r => { if(r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if(hit){ e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline', {status: 503});
  }));
});
