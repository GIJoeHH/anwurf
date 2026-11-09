/* ANWURF! – Service Worker für den Offline-Betrieb (automatisch erzeugt von web/deploy.sh, nicht von Hand ändern) */
const VERSION = '80e73f752e';
const CACHE = 'anwurf-' + VERSION;
const CORE = [
  './',
  './design.css',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './js/crests.js',
  './js/data.js',
  './js/data_real.js',
  './js/dbimport.js',
  './js/deals.js',
  './js/economy.js',
  './js/editor.js',
  './js/icons.js',
  './js/match.js',
  './js/numpad.js',
  './js/save.js',
  './js/season.js',
  './js/stadium.js',
  './js/stadium3d.js',
  './js/stadium_model.js',
  './js/touch.js',
  './js/transfers.js',
  './js/ui_art.js',
  './js/ui_club.js',
  './js/ui_core.js',
  './js/ui_deals.js',
  './js/ui_gfx.js',
  './js/ui_match.js',
  './js/ui_misc.js',
  './js/ui_stadium.js',
  './js/ui_team.js',
  './js/ui_widgets.js',
  './js/util.js',
  './js/version.js',
  './js/webapp.js',
  './js/world.js',
  './manifest.webmanifest',
  './style.css',
  './vendor/LICENSE-lucide.txt',
  './vendor/fonts/LICENSE-Inter.txt',
  './vendor/fonts/inter-latin-var.woff2',
  './vendor/three.min.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('anwurf-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // z. B. Tesseract (OCR) direkt aus dem Netz
  if (url.pathname.endsWith('/version.json')) return;
  // Alles aus dem Cache dieser Version (passt garantiert zusammen); Updates kommen über einen neuen Service Worker
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('./index.html') : null);
    return hit || fetch(req);
  }));
});
