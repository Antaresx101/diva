const APP_PREFIX = 'DIVA_';
const VERSION = 'version_04';
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
  "/diva/assets/GW_Layout 1.png",
  "/diva/assets/GW_Layout 2.png",
  "/diva/assets/GW_Layout 3.png",
  "/diva/assets/GW_Layout 4.png",
  "/diva/assets/GW_Layout 5.png",
  "/diva/assets/GW_Layout 6.png",
  "/diva/assets/GW_Layout 7.png",
  "/diva/assets/GW_Layout 8.png",
  "/diva/assets/WTC_Crucible of Battle 1.png",
  "/diva/assets/WTC_Crucible of Battle 2.png",
  "/diva/assets/WTC_Crucible of Battle 3.png",
  "/diva/assets/WTC_Crucible of Battle 4 - 5.png",
  "/diva/assets/WTC_Crucible of Battle 6.png",
  "/diva/assets/WTC_Crucible of Battle 7.png",
  "/diva/assets/WTC_Crucible of Battle 8.png",
  "/diva/assets/WTC_Dawn of War 1.png",
  "/diva/assets/WTC_Dawn of War 2.png",
  "/diva/assets/WTC_Dawn of War 3.png",
  "/diva/assets/WTC_Dawn of War 4.png",
  "/diva/assets/WTC_Dawn of War 5.png",
  "/diva/assets/WTC_Dawn of War 6.png",
  "/diva/assets/WTC_Search and Destroy 1.png",
  "/diva/assets/WTC_Search and Destroy 2.png",
  "/diva/assets/WTC_Search and Destroy 3.png",
  "/diva/assets/WTC_Search and Destroy 4 - 5.png",
  "/diva/assets/WTC_Search and Destroy 6.png",
  "/diva/assets/WTC_Search and Destroy 7.png",
  "/diva/assets/WTC_Search and Destroy 8.png",
  "/diva/assets/WTC_Sweeping Engagement 1.png",
  "/diva/assets/WTC_Sweeping Engagement 2.png",
  "/diva/assets/WTC_Sweeping Engagement 3.png",
  "/diva/assets/WTC_Sweeping Engagement 4.png",
  "/diva/assets/WTC_Sweeping Engagement 5.png",
  "/diva/assets/WTC_Sweeping Engagement 6.png",
  "/diva/assets/WTC_Tipping Point 1.png",
  "/diva/assets/WTC_Tipping Point 2.png",
  "/diva/assets/WTC_Tipping Point 3.png",
  "/diva/assets/WTC_Tipping Point 4 - 5.png",
  "/diva/assets/WTC_Tipping Point 6.png",
  "/diva/assets/WTC_Tipping Point 7.png",
  "/diva/assets/WTC_Tipping Point 8.png",
  '/diva/icons/icon-192x192.png',
  '/diva/icons/icon-512x512.png',
  '/diva/manifest.json'
];

// Cache resources during install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Installing cache: ' + CACHE_NAME);
      return cache.addAll(URLS).catch(err => {
        console.error('Failed to cache resources:', err);
      });
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
        console.log('No cache found for:', event.request.url);
        return new Response('Offline and no cached resource available', { status: 404 });
      });
    })
  );
});
