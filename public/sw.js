const CACHE_NAME = 'kristal-streams-v4';
const RUNTIME_CACHE = 'kristal-runtime-v4';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    // Network first: try fresh content, fall back to cache if offline
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
    );
  }
});

self.addEventListener('push', function(event) {
  let data = {
    title: 'Kristal Streams',
    message: 'New content available',
    url: '/'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: '/android/icon-192.png',
    badge: '/android/icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'explore',
        title: 'Watch Now',
        icon: '/android/icon-96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/android/icon-96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Kristal Streams', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-channels') {
    event.waitUntil(syncChannels());
  }
});

async function syncChannels() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const response = await fetch('/api/channels');
    await cache.put('/api/channels', response.clone());
    return response;
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}