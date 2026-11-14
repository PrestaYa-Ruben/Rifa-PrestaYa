/* Rifas PrestaYa · service worker v3.6
   Abre al instante desde el celular (caché primero) y se actualiza en segundo plano. */
const CACHE = 'rifas-py-v3.8';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png',
  './fonts/allura-latin-400-normal.woff2',
  './fonts/inter-latin-400-normal.woff2',
  './fonts/inter-latin-500-normal.woff2',
  './fonts/inter-latin-600-normal.woff2',
  './fonts/inter-latin-700-normal.woff2',
  './fonts/inter-latin-800-normal.woff2',
  './fonts/montserrat-latin-500-normal.woff2',
  './fonts/montserrat-latin-600-normal.woff2',
  './fonts/montserrat-latin-700-normal.woff2',
  './fonts/montserrat-latin-800-normal.woff2',
  './fonts/poppins-latin-400-normal.woff2',
  './fonts/poppins-latin-500-normal.woff2',
  './fonts/poppins-latin-600-normal.woff2',
  './fonts/poppins-latin-700-normal.woff2',
  './fonts/poppins-latin-800-normal.woff2',
  './fonts/poppins-latin-900-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Descarga la versión nueva sin hacer esperar al usuario
function actualizar(req, key) {
  return fetch(req, { cache: 'no-store' }).then(r => {
    if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key || req, copy)); }
    return r;
  });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;           // Firebase, is.gd, WhatsApp: directo a la red
  if (e.request.mode === 'navigate') {
    // Caché primero: la app abre al instante aunque no haya señal
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const red = actualizar(e.request, './index.html').catch(() => null);
        if (cached) { e.waitUntil(red); return cached; }
        // Primera vez sin caché: espera la red (máx. 8 s)
        return Promise.race([red, new Promise(res => setTimeout(() => res(null), 8000))])
          .then(r => r || new Response('<h3 style="font-family:sans-serif;padding:24px">Sin conexión. Abre la app una vez con internet para usarla sin señal.</h3>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      })
    );
    return;
  }
  // Archivos de la app (íconos, fuentes): caché primero
  e.respondWith(caches.match(e.request).then(r => r || actualizar(e.request).catch(() => caches.match('./index.html'))));
});
