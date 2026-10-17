/* BARLIVE_SW_RETIREMENT_V1
 *
 * BarLive no longer relies on the legacy GitHub Pages service worker in
 * production. This tiny worker exists only so browsers that still have the old
 * worker registered receive a valid replacement instead of the SPA HTML
 * fallback at /sw.js. It clears legacy caches, takes control once, unregisters
 * itself and reloads open tabs onto the canonical Cloudflare deployment.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (_) {
      // Cache cleanup is best-effort; never block retirement.
    }

    try {
      await self.clients.claim();
    } catch (_) {
      // Continue even if claim is unavailable.
    }

    try {
      await self.registration.unregister();
    } catch (_) {
      // The app remains network-first even if unregister is delayed.
    }

    try {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      await Promise.all(
        windows.map((client) =>
          typeof client.navigate === 'function'
            ? client.navigate(client.url)
            : Promise.resolve()
        )
      );
    } catch (_) {
      // Open tabs can be refreshed manually if a browser blocks navigation.
    }
  })());
});
