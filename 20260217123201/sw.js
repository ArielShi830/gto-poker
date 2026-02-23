const CACHE_NAME = 'gto-helper-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './poker.js',
  './gto.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装事件 - 缓存所有资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存资源中...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('缓存完成');
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中则返回缓存
        if (response) {
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request)
          .then((networkResponse) => {
            // 检查是否是有效响应
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // 克隆响应并缓存
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // 网络失败时，尝试返回缓存的主页
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 后台同步（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-history') {
    console.log('后台同步历史记录');
  }
});

// 推送通知（可选）
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'GTO助手有新消息',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('GTO决策助手', options)
  );
});
