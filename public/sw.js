// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = 'v3::static';

self.addEventListener('install', e => {
  // once the SW is installed, go ahead and fetch the resources
  // to make this work offline
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([
        /* nothing for now */
      ]).then(() => self.skipWaiting());
    })
  );
});
