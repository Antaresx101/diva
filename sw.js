const APP_PREFIX = 'DIVA_';
const VERSION = 'version_02'; // Updated to force cache refresh
const CACHE_NAME = APP_PREFIX + VERSION;
const URLS = [
  '/diva/',
  '/diva/index.html',
  '/diva/styles.css',
  '/diva/app.js',
  '/diva/assets/terrain.png',
  '/diva/icons/icon-192x192.png',
  '/diva/icons/icon-512x512.png',
  '/diva/manifest.json'
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
  self.clients.claim();
});

// Handle fetch requests (offline-first)
self.addEventListener('fetch', event => {
  console.log('Service Worker fetch:', event.request.url, event.request.mode); // Debug log
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log('Serving from cache:', event.request.url);
        return response;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        console.log('Fetched from network:', event.request.url);
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          console.log('Falling back to /diva/index.html for navigation');
          return caches.match('/diva/index.html');
        }
      });
    })
  );
});
