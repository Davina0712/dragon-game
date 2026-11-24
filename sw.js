// Keeps the game working with no internet. Bump VERSION when you update the game.
const VERSION = 'dragon-v27';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png', './icons/icon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  const fromCache = () => caches.match(req, {ignoreSearch: true})
    .then(m => m || (isPage ? caches.match('./index.html', {ignoreSearch: true}).then(x => x || caches.match('./')) : null));
  e.respondWith(
    fetch(req).then(r => {
      // Only trust a good answer. If Netlify shows "Site not available" (for example when credits run out),
      // keep playing the copy saved on this phone instead of replacing it.
      if (!r.ok) throw new Error('bad status');
      const copy = r.clone();
      if (!isPage){ caches.open(VERSION).then(c => c.put(req, copy)); return r; }
      return r.clone().text().then(txt => {
        if (!txt.includes('const APP_BUILD')) throw new Error('not the game');
        caches.open(VERSION).then(c => c.put(url.search ? './index.html' : req, copy));
        return r;
      });
    }).catch(() => fromCache().then(m => m || fetch(req)))
  );
});
// tapping a notification opens the game
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => list.length ? list[0].focus() : self.clients.openWindow('./')));
});
