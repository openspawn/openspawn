// Self-destroying service worker.
// Replaces any previously-registered SW at this scope,
// then immediately unregisters itself and clears all caches.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister();
  caches.keys().then(names => names.forEach(n => caches.delete(n)));
});
