const CACHE_VERSION = 'v1';
const CACHE_NAME = `noagentnaija-${CACHE_VERSION}`;
const RUNTIME_CACHE = `noagentnaija-runtime-${CACHE_VERSION}`;
const API_CACHE = `noagentnaija-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `noagentnaija-images-${CACHE_VERSION}`;
const VIDEO_CACHE = `noagentnaija-videos-${CACHE_VERSION}`;

// Assets that must be cached on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// API endpoints that should be cached when possible
const CACHEABLE_API_ENDPOINTS = new Set([
  '/api/testimonials',
  '/api/technicians',
  '/api/property'
]);


// Install event: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((error) => {
        console.warn('Failed to cache critical assets:', error);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove old versions
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== IMAGE_CACHE &&
            cacheName !== VIDEO_CACHE &&
            cacheName.startsWith('noagentnaija-')
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { method, url } = request;

  // Skip non-GET requests
  if (method !== 'GET') {
    return;
  }

  const urlObject = new URL(url);

  // API calls: network-first strategy with fallback to cache
  if (urlObject.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Images: cache-first strategy
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(urlObject.pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Videos: cache-first strategy
  if (/\.(mp4|webm|ogg)$/i.test(urlObject.pathname)) {
    event.respondWith(handleVideoRequest(request));
    return;
  }

  // HTML pages and JS bundles: network-first strategy
  event.respondWith(handleDocumentRequest(request));
});

/**
 * Handle API requests - network-first with cache fallback
 */
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    // Note: avoid caching partial (206 Range) responses because Cache API cannot store them.
    if (response && response.ok && response.status === 200) {
      const responseToCache = response.clone();
      caches.open(API_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
    }


    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API
    return createOfflineResponse('API', request.url);
  }
}

/**
 * Handle image requests - cache-first strategy
 */
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Avoid caching partial (206 Range) responses.
    if (response.ok && response.status !== 206) {
      const responseToCache = response.clone();
      caches.open(IMAGE_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
      return response;
    }


    return createPlaceholderImage();
  } catch {
    return createPlaceholderImage();
  }
}

/**
 * Handle video requests - cache-first strategy
 */
async function handleVideoRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Avoid caching partial (206 Range) responses.
    if (response.ok && response.status !== 206 && response.headers.get('content-length')) {
      // Only cache if we know the size (avoid huge downloads)
      const contentLength = parseInt(response.headers.get('content-length'), 10);
      if (contentLength < 50 * 1024 * 1024) { // 50MB limit
        const responseToCache = response.clone();
        caches.open(VIDEO_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
    }


    return response;
  } catch {
    // No fallback for videos
    return new Response('Video unavailable offline', { status: 503 });
  }
}

/**
 * Handle document requests (HTML, JS) - network-first strategy
 */
async function handleDocumentRequest(request) {
  try {
    const response = await fetch(request);

    // Avoid caching partial (206 Range) responses.
    if (response.ok && response.status !== 206) {
      const responseToCache = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
      return response;
    }


    // If network response is not ok, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return response;
  } catch {
    // Network failed
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

  // Return offline page if requesting an HTML document
    if (request.headers.get('accept')?.includes('text/html')) {
      // Prefer a real offline document to reduce runtime response size
      return caches.match('/offline.html').then((cached) => {
        return cached || createOfflinePage();
      });
    }


    return new Response('Offline', { status: 503 });
  }
}

/**
 * Create offline page response
 */
function createOfflinePage() {
  // Fallback if /offline.html isn't cached yet
  return new Response(`
    <!DOCTYPE html>

    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>NoAgentNaija - Offline</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: linear-gradient(135deg, #f7f1e8 0%, #ead6b7 45%, #f6efe6 100%);
          color: #211407;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .offline-container {
          text-align: center;
          background: rgba(255, 252, 246, 0.95);
          border-radius: 20px;
          padding: 3rem 2rem;
          max-width: 500px;
          box-shadow: 0 24px 50px rgba(73, 42, 16, 0.12);
          backdrop-filter: blur(10px);
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }
        h1 {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #211407;
        }
        p {
          font-size: 1rem;
          color: #5a4330;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .offline-tips {
          text-align: left;
          background: rgba(184, 92, 56, 0.05);
          border-left: 4px solid #b85c38;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .offline-tips strong {
          display: block;
          color: #b85c38;
          margin-bottom: 0.5rem;
        }
        .offline-tips li {
          margin-left: 1.5rem;
          color: #5a4330;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        button {
          background: #b85c38;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        button:hover {
          background: #8f4325;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📵</div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Don't worry—we'll reconnect automatically when you're back online.</p>
        <div class="offline-tips">
          <strong>What you can still do:</strong>
          <ul>
            <li>View cached properties and listings</li>
            <li>Check your saved information</li>
            <li>Read testimonials and guides</li>
          </ul>
        </div>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * Create offline API response
 */
function createOfflineResponse(type, url) {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: `${type} request failed. You appear to be offline. Please check your internet connection.`,
      url,
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create placeholder image response
 */
function createPlaceholderImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#e0d5c0"/>
    <rect x="50" y="50" width="300" height="200" fill="#d4c5b0" rx="10"/>
    <circle cx="200" cy="120" r="30" fill="#b85c38" opacity="0.3"/>
    <rect x="100" y="170" width="200" height="40" fill="#b85c38" opacity="0.2" rx="5"/>
  </svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push notification received but no data');
    return;
  }

  let notificationData = {
    title: 'NoAgentNaija',
    body: 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'noagentnaija-notification',
    requireInteraction: false
  };

  try {
    notificationData = { ...notificationData, ...event.data.json() };
  } catch {
    notificationData.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions || [],
      data: notificationData.data || {}
    })
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no matching window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-testimonials') {
    event.waitUntil(syncTestimonials());
  }
  if (event.tag === 'sync-properties') {
    event.waitUntil(syncProperties());
  }
});

async function syncTestimonials() {
  try {
    const cache = await caches.open(API_CACHE);
    const response = await fetch('/api/testimonials?limit=24');
    if (response.ok) {
      cache.put('/api/testimonials?limit=24', response.clone());
    }
  } catch (error) {
    console.log('Background sync failed for testimonials:', error);
  }
}

async function syncProperties() {
  try {
    const cache = await caches.open(API_CACHE);
    const response = await fetch('/api/property');
    if (response.ok) {
      cache.put('/api/property', response.clone());
    }
  } catch (error) {
    console.log('Background sync failed for properties:', error);
  }
}

/**
 * Message event: handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('noagentnaija-')) {
            return caches.delete(cacheName);
          }
        })
      );
    });
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(RUNTIME_CACHE).then((cache) => {
      urls.forEach((url) => {
        cache.add(url).catch((error) => {
          console.warn(`Failed to cache ${url}:`, error);
        });
      });
    });
  }
});
