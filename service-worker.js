// 获取当前 Service Worker 所在的路径前缀（例如 /repo-name/）
const basePath = self.location.pathname.replace(/service-worker\.js$/, '');

// 需要缓存的所有资源（相对于站点根目录的路径，不带前导斜杠？不，我们动态拼接 basePath）
// 注意：这些路径是相对于站点根目录的，但实际部署在子目录时，需要加上 basePath
const resourcesToCache = [
  '',           // 对应 basePath 本身（即 index.html）
  'index.html',
  'manifest.json',
  'img/logo_rounded_128.png',
  'img/logo_rounded_192.png',
  'img/logo_rounded_512.png',
  'online_ps/index_files/all.07b30523.css',
  'online_ps/index_files/ext.1f549f71.js',
  'online_ps/index_files/PIMG.7fad0008.js',
  'online_ps/index_files/FNTS.387a84cd.js',
  'online_ps/index_files/LNG2.61be097a.js',
  'online_ps/index_files/pp.3c4e1c87.js',
  'js/global.js'
];

// 生成完整的 URL 列表
const urlsToCache = resourcesToCache.map(res => basePath + res);

const CACHE_NAME = 'ps-editor-v3';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存资源，basePath:', basePath);
        console.log('缓存列表:', urlsToCache);
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
  const requestUrl = new URL(event.request.url);
  // 只处理同源请求，避免跨域问题
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  
  // 如果请求路径不是以 basePath 开头，且不是根路径请求，可以跳过（避免缓存无关内容）
  // 但为了简单，我们只缓存明确列出的资源，其他走网络
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // 只缓存 GET 请求且成功的响应
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // 离线时回退到主页
          return caches.match(basePath + 'index.html');
        });
      })
  );
});
