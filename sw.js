const CACHE_NAME = 'arox-cert-v4';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './manifest.json',
  './assets/a logo.png',
  './assets/frame.png',
  './assets/ChatGPT Image Jun 22, 2026, 12_49_34 AM.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bypass Firebase, Firestore, and Google Fonts
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('gstatic.com') || 
      url.hostname.includes('google.com')) {
    return; // Let the browser handle it
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache dynamically
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache if offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Prevent "Failed to convert value to Response" by returning a fallback
        return new Response('Network Error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
