// Bump CACHE whenever the asset list or the shipped bundle changes.
const CACHE = 'promptwise-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/tasks.js',
  '/src/rules.js',
  '/src/guidance.js',
  '/src/validation.js',
  '/src/workflow.js',
  '/src/materials.js',
  '/src/styles.css',
  '/public/icon.svg',
  '/public/manifest.webmanifest'
];
// Only the app shell is cached. Private files, API responses and anything else go to the network untouched.
const CACHEABLE = new Set(ASSETS);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('promptwise-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !CACHEABLE.has(url.pathname)) return;
  // Network first so a refresh always shows the current version; the cache is the offline fallback.
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(url.pathname, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(url.pathname);
      return cached || (event.request.mode === 'navigate' ? caches.match('/index.html') : Response.error());
    }
  })());
});
