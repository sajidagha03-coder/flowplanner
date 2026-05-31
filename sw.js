const CACHE_NAME = 'pa-v8';
const FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always network-first for HTML and JS
  if (e.request.url.includes('.html') || e.request.url.includes('.js') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'})
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache first for images/fonts
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
