// Bump CACHE whenever the asset list or the shipped bundle changes.
const CACHE = 'promptwise-v25';
const ASSETS = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/practice.js',
  '/src/practice-view.js',
  '/src/tasks.js',
  '/src/examples.js',
  '/src/rules.js',
  '/src/guidance.js',
  '/src/validation.js',
  '/src/workflow.js',
  '/src/ai-client.js',
  '/src/materials.js',
  '/src/document-materials.js',
  '/src/styles.css',
  '/public/team/thai.jpeg',
  '/public/team/amara-atif.jpeg',
  '/public/team/noah.png',
  '/public/icon.svg',
  '/public/manifest.webmanifest',
  '/public/vendor/manifest.json'
];
// Only the app shell is cached. Private files, API responses and anything else go to the network untouched.
const CACHEABLE = new Set(ASSETS);
const addVendorAssets = paths => {
  if (!Array.isArray(paths) || paths.some(path => !/^\/public\/vendor\/[\w./-]+$/.test(path) || path.includes('..'))) throw new Error('Invalid parser asset manifest');
  paths.forEach(path => CACHEABLE.add(path));
  return paths;
};
// Restore the exact generated allowlist when the browser restarts the worker.
const vendorReady = caches.open(CACHE).then(cache => cache.match('/public/vendor/manifest.json'))
  .then(response => response ? response.json().then(addVendorAssets) : []).catch(() => []);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch('/public/vendor/manifest.json', { cache: 'reload' });
    if (!response.ok) throw new Error('Parser assets unavailable');
    const vendor = addVendorAssets(await response.json());
    const cache = await caches.open(CACHE);
    await cache.addAll([...ASSETS, ...vendor].map(url => new Request(url, { cache: 'reload' })));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('promptwise-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || (!CACHEABLE.has(url.pathname) && !url.pathname.startsWith('/public/vendor/'))) return;
  // Network first so a refresh always shows the current version; the cache is the offline fallback.
  event.respondWith((async () => {
    try {
      await vendorReady;
      if (!CACHEABLE.has(url.pathname)) return fetch(event.request);
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(url.pathname, response.clone());
      }
      return response;
    } catch {
      if (!CACHEABLE.has(url.pathname)) throw new Error('Not a cached parser asset');
      const cache = await caches.open(CACHE);
      const cached = await cache.match(url.pathname);
      return cached || (event.request.mode === 'navigate' ? caches.match('/index.html') : Response.error());
    }
  })());
});
