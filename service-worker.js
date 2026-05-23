const CACHE_NAME = 'ps-editor-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/logo_rounded_128.png',
  '/img/logo_rounded_192.png',
  '/img/logo_rounded_512.png',
  '/online_ps/index_files/all.07b30523.css',
  '/online_ps/index_files/ext.1f549f71.js',
  '/online_ps/index_files/PIMG.7fad0008.js',
  '/online_ps/index_files/FNTS.387a84cd.js',
  '/online_ps/index_files/LNG2.61be097a.js',
  '/online_ps/index_files/pp.3c4e1c87.js',
  '/js/global.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存关键资源');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('删除旧缓存', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || event.request.method !== 'GET') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          return caches.match('/index.html');
        });
      })
  );
});