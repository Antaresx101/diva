const APP_PREFIX = 'DIVA_';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/assets/terrain.png'
];

// Cache resources during install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Installing cache: ' + CACHE_NAME);
      return cache.addAll(URLS);
    })
  );
});

// Clear outdated caches during activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key.startsWith(APP_PREFIX)) {
            console.log('Deleting old cache: ' + key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Handle fetch requests (offline-first)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Fallback to index.html for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});