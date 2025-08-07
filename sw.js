const APP_PREFIX = 'DIVA_';
const VERSION = 'version_06'; // Incremented to clear old cache
const CACHE_NAME = APP_PREFIX + VERSION;
const URLS = [
  '/diva/',
  '/diva/index.html',
  '/diva/styles.css',
  '/diva/main.js',
  '/diva/config.js',
  '/diva/stageSetup.js',
  '/diva/unitManagement.js',
  '/diva/deploymentZones.js',
  '/diva/objectives.js',
  '/diva/uiControls.js',
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
      return Promise.all(
        URLS.map(url => cache.add(url).catch(err => console.error(`Failed to cache ${url}:`, err)))
      );
    })
  );
  self.skipWaiting();
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

// Handle fetch requests (network-first)
self.addEventListener('fetch', event => {
  console.log('Service Worker fetch:', event.request.url, 'Mode:', event.request.mode);
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(networkResponse => {
      console.log('Fetched from network:', event.request.url);
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
          console.log('Cached:', event.request.url);
        });
      }
      return networkResponse;
    }).catch(() => {
      console.log('Network failed, falling back to cache for:', event.request.url);
      return caches.match(event.request).then(response => {
        if (response) {
          console.log('Served from cache:', event.request.url);
          return response;
        }
        if (event.request.mode === 'navigate') {
          console.log('Falling back to /diva/index.html for navigation');
          return caches.match('/diva/index.html');
        }
        if (event.request.url.includes('/diva/assets/terrain.png')) {
          console.log('Terrain image not found, serving fallback response');
          return new Response('Terrain image unavailable', { status: 404 });
        }
        console.log('No cache found for:', event.request.url);
        return new Response('Offline and no cached resource available', { status: 404 });
      });
    })
  );
});
