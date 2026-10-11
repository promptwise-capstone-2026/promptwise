// Hosted demo worker v23: intentionally has no fetch handler or offline cache.
// A worker fetch proxy can suppress native HTTP Basic login after the browser's
// authentication session ends. Leave navigations and assets to the browser.
// Use the existing /sw.js registration URL to replace earlier offline workers.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('promptwise-'))
      .map(key => caches.delete(key)));
    // Claim open pages so the previous fetch handler stops intercepting them.
    // CacheStorage contains app assets only; localStorage History is untouched.
    await self.clients.claim();
  })());
});
