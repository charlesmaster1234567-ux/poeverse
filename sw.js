/* ============================================
   POEVERSE - SERVICE WORKER
   Version: 2.0
   ============================================ */

const CACHE_NAME = 'poeverse-v2.0.0';
const RUNTIME_CACHE = 'poeverse-runtime-v2.0.0';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/me.jpg',
  '/preview.png',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&display=swap',
  // External scripts
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Core assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache core assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests except for fonts and CDN
  if (url.origin !== location.origin && 
      !url.href.includes('fonts.googleapis.com') &&
      !url.href.includes('fonts.gstatic.com') &&
      !url.href.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Serve from cache if offline
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page if available
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version, but also fetch updated version in background
            fetchAndCache(request);
            return cachedResponse;
          }
          // Not in cache, fetch from network
          return fetchAndCache(request);
        })
    );
    return;
  }

  // Default: network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Helper function to fetch and cache
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle background sync for form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-poems') {
    event.waitUntil(syncPoems());
  }
  
  if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletter());
  }
});

async function syncPoems() {
  try {
    const cache = await caches.open('poeverse-pending');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('submit-poem')) {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Retry the submission
        await fetch('/api/submit-poem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        // Remove from pending cache
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncNewsletter() {
  try {
    const cache = await caches.open('poeverse-pending');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('newsletter')) {
        const response = await cache.match(request);
        const data = await response.json();
        
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('[SW] Newsletter sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'PoeVerse',
    body: 'New poem of the day is available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'poem-notification',
    data: {
      url: '/#poemOfDay'
    }
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'read',
        title: 'Read Now',
        icon: '/icons/action-read.png'
      },
      {
        action: 'later',
        title: 'Later',
        icon: '/icons/action-later.png'
      }
    ],
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'later') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-poems') {
    event.waitUntil(updatePoemsCache());
  }
});

async function updatePoemsCache() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const response = await fetch('/api/poems');
    
    if (response.ok) {
      await cache.put('/api/poems', response);
    }
  } catch (error) {
    console.error('[SW] Failed to update poems cache:', error);
  }
}

console.log('[SW] Service Worker loaded');

/* ============================================
   WIDGET UPDATE HANDLER
   ============================================ */

// Handle widget updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-widgets') {
    event.waitUntil(updateWidgets());
  }
});

async function updateWidgets() {
  try {
    // Fetch latest poem data
    const poemResponse = await fetch('/api/poem-of-day.json');
    const poemData = await poemResponse.json();
    
    // Fetch latest stats
    const statsResponse = await fetch('/api/reading-stats.json');
    const statsData = await statsResponse.json();
    
    // Update widget cache
    const cache = await caches.open('widgets-cache');
    await cache.put('/api/poem-of-day.json', new Response(JSON.stringify(poemData)));
    await cache.put('/api/reading-stats.json', new Response(JSON.stringify(statsData)));
    
    // Notify all clients about widget update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'WIDGET_UPDATED',
        data: { poem: poemData, stats: statsData }
      });
    });
    
    console.log('[SW] Widgets updated successfully');
  } catch (error) {
    console.error('[SW] Widget update failed:', error);
  }
}

// Handle widget requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercept widget data requests
  if (url.pathname.startsWith('/api/') && url.pathname.includes('widget')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Serve from cache, update in background
            event.waitUntil(updateWidgets());
            return cachedResponse;
          }
          return fetch(event.request);
        })
    );
  }
});