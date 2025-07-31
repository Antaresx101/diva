const APP_PREFIX = 'DIVA_';
const VERSION = 'version_03'; // Bumped to clear old caches
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
  self.skipWaiting(); // Force immediate activation
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

// Handle fetch requests (network-first)
self.addEventListener('fetch', event => {
  console.log('Service Worker fetch:', event.request.url, 'Mode:', event.request.mode);
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Try network first
    fetch(event.request).then(networkResponse => {
      console.log('Fetched from network:', event.request.url);
      // Cache the new response
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
          console.log('Cached:', event.request.url);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Fallback to cache if network fails (offline)
      console.log('Network failed, falling back to cache for:', event.request.url);
      return caches.match(event.request).then(response => {
        if (response) {
          console.log('Served from cache:', event.request.url);
          return response;
        }
        // Fallback to index.html for navigation requests
        if (event.request.mode === 'navigate') {
          console.log('Falling back to /diva/index.html for navigation');
          return caches.match('/diva/index.html');
        }
        console.log('No cache found for:', event.request.url);
        return new Response('Offline and no cached resource available', { status: 404 });
      });
    })
  );
});
