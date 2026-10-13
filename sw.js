/* Survivor 51 Draft — service worker.
   Network-FIRST on purpose: every launch asks the server for the newest
   index.html (so a new upload shows up immediately and nobody is stuck on an
   old cached copy); the cached copy is only used when the phone is offline.
   Firebase, Google Fonts and other outside hosts are never touched. */
const CACHE = 'survivor51-shell-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // outside hosts: browser handles it
  e.respondWith(
    fetch(req.url, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{}); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html') || caches.match('./')))
  );
});
