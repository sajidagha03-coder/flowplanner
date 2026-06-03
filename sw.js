// v12 — self-updating service worker
// When this SW activates, it clears ALL caches and forces clients to reload
const CACHE = 'pa-v12';

self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => {
        // Tell ALL open clients to reload
        return self.clients.matchAll({type:'window', includeUncontrolled:true});
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({type:'FORCE_RELOAD'});
        });
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', e => {
  // HTML + JS = always network, never cache
  if(e.request.url.includes('.html') || e.request.url.includes('.js') || e.request.url.endsWith('/')) {
    e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request)));
    return;
  }
  // Assets = cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
