/**
 * Jützlify Service Worker
 * Full PWA support with offline functionality
 * - Caches app shell (HTML, CSS, JS) for offline access
 * - Caches audio streams for offline playback
 * - Caches API responses for offline data access
 */

const CACHE_VERSION = 2;
const AUDIO_CACHE = 'juetzlify-audio-v2';
const APP_SHELL_CACHE = 'juetzlify-app-shell-v2';
const API_CACHE = 'juetzlify-api-v2';

// For backwards compatibility
const CACHE_NAME = AUDIO_CACHE;

// Detect platform for adaptive cache limits
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /android/i.test(navigator.userAgent);

// Platform-specific cache limits
// iOS Safari is most restrictive (~50MB safe limit)
// Chrome Android is generous (several GB possible)
// Desktop browsers have ample storage
const MAX_CACHED_TRACKS = (() => {
  if (isIOS && isSafari) {
    return 10; // ~67 MB - conservative for iOS Safari
  } else if (isAndroid) {
    return 30; // ~200 MB - safe for most Android devices
  } else {
    return 50; // ~334 MB - generous for desktop
  }
})();

// Cache duration in milliseconds (7 days)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// App shell files to pre-cache (will be populated dynamically)
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  // Note: Vite build outputs with hashed filenames will be cached dynamically
];

/**
 * Install event - called when service worker is first installed
 */
self.addEventListener('install', (event) => {
  const platform = isIOS ? 'iOS Safari' : isAndroid ? 'Android' : 'Desktop';
  console.log(`[Jützlify SW] Installing service worker...`);
  console.log(`[Jützlify SW] Platform: ${platform}, Max cached tracks: ${MAX_CACHED_TRACKS}`);

  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      console.log('[Jützlify SW] Pre-caching app shell');
      return cache.addAll(APP_SHELL_FILES).catch((error) => {
        console.warn('[Jützlify SW] Failed to pre-cache some files:', error);
        // Don't fail installation if pre-caching fails
      });
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - called when service worker takes control
 */
self.addEventListener('activate', (event) => {
  console.log('[Jützlify SW] Activating service worker...');

  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) =>
            name.startsWith('juetzlify-') &&
            name !== AUDIO_CACHE &&
            name !== APP_SHELL_CACHE &&
            name !== API_CACHE
          )
          .map((name) => {
            console.log('[Jützlify SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - intercept network requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio streams - Special caching with pinning and range support
  if (url.pathname.startsWith('/api/stream/')) {
    event.respondWith(handleAudioRequest(event.request));
    return;
  }

  // Album art - Cache first strategy
  if (url.pathname.startsWith('/api/album-art/')) {
    event.respondWith(handleCacheFirst(event.request, API_CACHE));
    return;
  }

  // API calls - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleNetworkFirst(event.request, API_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, fonts) - Cache first
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(handleCacheFirst(event.request, APP_SHELL_CACHE));
    return;
  }

  // HTML navigation - Network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNetworkFirst(event.request, APP_SHELL_CACHE));
    return;
  }

  // Everything else - Network only
  event.respondWith(fetch(event.request));
});

/**
 * Cache-first strategy: Try cache first, then network
 */
async function handleCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and cache for future use
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Jützlify SW] Fetch failed:', error);
    // Return offline fallback if available
    return new Response('Offline - resource not cached', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network-first strategy: Try network first, fall back to cache
 */
async function handleNetworkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Update cache with fresh response
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[Jützlify SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // No cache available - return offline page for navigation
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline and not cached', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Handle audio streaming requests with caching
 */
async function handleAudioRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  const trackId = url.pathname.split('/').pop();

  // Create a cache key without range headers
  const cacheKey = new Request(request.url, {
    method: 'GET',
    headers: new Headers({
      'Accept': 'audio/mpeg'
    })
  });

  try {
    // Check if we have this track in cache
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      // Check cache age
      const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
      const now = new Date();

      if (now - cachedDate < CACHE_DURATION) {
        console.log('[Jützlify SW] Serving audio from cache:', trackId);

        // Handle range requests from cached response
        if (request.headers.get('range')) {
          return createRangeResponse(cachedResponse.clone(), request);
        }

        return cachedResponse;
      } else {
        console.log('[Jützlify SW] Cache expired for:', trackId);
        await cache.delete(cacheKey);
      }
    }

    // Not in cache or expired - fetch from network
    console.log('[Jützlify SW] Fetching from network:', trackId);
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.ok && networkResponse.status === 200) {
      // Clone the response to cache it
      const responseToCache = networkResponse.clone();

      // Read the response as blob
      const blob = await responseToCache.blob();

      // Create a new response with cache metadata
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      headers.set('sw-cached-version', CACHE_VERSION.toString());

      const cachedResponse = new Response(blob, {
        status: 200,
        statusText: 'OK',
        headers: headers
      });

      // Store in cache (don't await - cache in background)
      cache.put(cacheKey, cachedResponse.clone()).then(async () => {
        console.log('[Jützlify SW] Cached:', trackId);
        // Clean up old cache entries
        await cleanupCache(cache);
      });
    }

    return networkResponse;

  } catch (error) {
    console.error('[Jützlify SW] Error handling request:', error);

    // Try to serve from cache even if expired (offline fallback)
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      console.log('[Jützlify SW] Network failed, serving stale cache:', trackId);
      return cachedResponse;
    }

    // No cache available - return error
    return new Response('Network error and no cache available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Create a range response from a cached full response
 */
async function createRangeResponse(cachedResponse, request) {
  const rangeHeader = request.headers.get('range');
  const blob = await cachedResponse.blob();
  const totalSize = blob.size;

  // Parse range header
  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) {
    return cachedResponse;
  }

  const start = parseInt(rangeMatch[1], 10);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : totalSize - 1;
  const chunkSize = (end - start) + 1;

  // Extract the requested range from the blob
  const chunk = blob.slice(start, end + 1);

  // Create range response
  const headers = new Headers(cachedResponse.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${totalSize}`);
  headers.set('Content-Length', chunkSize.toString());
  headers.set('Accept-Ranges', 'bytes');

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: headers
  });
}

/**
 * Clean up old cache entries when limit is exceeded
 */
async function cleanupCache(cache, options = {}) {
  const keys = await cache.keys();

  if (keys.length <= MAX_CACHED_TRACKS && !options.forceful) {
    return;
  }

  console.log(`[Jützlify SW] Cache limit exceeded (${keys.length}/${MAX_CACHED_TRACKS}), cleaning up...`);

  // Get all cached items with their dates and pinned status
  const items = await Promise.all(
    keys.map(async (request) => {
      const response = await cache.match(request);
      const cachedDate = new Date(response.headers.get('sw-cached-date'));
      const isPinned = response.headers.get('sw-pinned') === 'true';
      return { request, cachedDate, isPinned };
    })
  );

  // Separate pinned and unpinned items
  const pinnedItems = items.filter((item) => item.isPinned);
  const unpinnedItems = items.filter((item) => !item.isPinned);

  // Only delete unpinned items
  if (unpinnedItems.length === 0) {
    console.log('[Jützlify SW] All items are pinned, cannot cleanup');
    return;
  }

  // Sort unpinned by date (oldest first)
  unpinnedItems.sort((a, b) => a.cachedDate - b.cachedDate);

  // Calculate how many to delete
  const targetSize = options.forceful ? MAX_CACHED_TRACKS : MAX_CACHED_TRACKS;
  const toDelete = unpinnedItems.slice(0, Math.max(0, keys.length - targetSize));

  await Promise.all(
    toDelete.map((item) => {
      console.log('[Jützlify SW] Deleting old unpinned cache entry');
      return cache.delete(item.request);
    })
  );

  console.log(`[Jützlify SW] Cleanup complete. Cache size: ${keys.length - toDelete.length} (${pinnedItems.length} pinned)`);
}

/**
 * Message handler for commands from the main app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Jützlify SW] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys();
        event.ports[0].postMessage({
          success: true,
          cachedTracks: keys.length,
          maxTracks: MAX_CACHED_TRACKS
        });
      })
    );
  }

  if (event.data && event.data.type === 'DOWNLOAD_TRACK') {
    event.waitUntil(
      downloadTrackWithProgress(event.data.trackId, event.data.url, event.ports[0])
    );
  }

  if (event.data && event.data.type === 'REMOVE_DOWNLOAD') {
    event.waitUntil(
      removeDownloadFromCache(event.data.trackId).then(() => {
        console.log('[Jützlify SW] Download removed:', event.data.trackId);
      })
    );
  }

  if (event.data && event.data.type === 'PIN_TRACK') {
    event.waitUntil(
      pinTrackInCache(event.data.trackId).then(() => {
        console.log('[Jützlify SW] Track pinned:', event.data.trackId);
      })
    );
  }
});

/**
 * Download track with progress tracking
 */
async function downloadTrackWithProgress(trackId, url, port) {
  try {
    console.log('[Jützlify SW] Starting download:', trackId);

    const response = await fetch(url);

    if (!response.ok) {
      port.postMessage({
        type: 'DOWNLOAD_ERROR',
        error: `HTTP ${response.status}`,
      });
      return;
    }

    const reader = response.body.getReader();
    const contentLength = +response.headers.get('content-length');

    let receivedLength = 0;
    let chunks = [];
    let lastProgressUpdate = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      // Update every 500ms or 5% progress
      const now = Date.now();
      const progress = receivedLength / contentLength;
      if (now - lastProgressUpdate > 500 || progress - (receivedLength - value.length) / contentLength >= 0.05) {
        port.postMessage({
          type: 'DOWNLOAD_PROGRESS',
          trackId,
          progress,
        });
        lastProgressUpdate = now;
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, { type: 'audio/mpeg' });

    // Create cache key
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = new Request(url, {
      method: 'GET',
      headers: new Headers({
        'Accept': 'audio/mpeg'
      })
    });

    // Create response with pinned flag
    const headers = new Headers({
      'Content-Type': 'audio/mpeg',
      'Content-Length': blob.size.toString(),
      'sw-cached-date': new Date().toISOString(),
      'sw-cached-version': CACHE_VERSION.toString(),
      'sw-pinned': 'true', // Mark as pinned to prevent auto-deletion
    });

    const cachedResponse = new Response(blob, {
      status: 200,
      statusText: 'OK',
      headers: headers,
    });

    // Store in cache
    try {
      await cache.put(cacheKey, cachedResponse);
      console.log('[Jützlify SW] Download complete:', trackId);

      port.postMessage({
        type: 'DOWNLOAD_COMPLETE',
        trackId,
        size: blob.size,
      });
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Try cleanup and retry once
        await cleanupCache(cache, { forceful: true });
        try {
          await cache.put(cacheKey, cachedResponse);
          port.postMessage({
            type: 'DOWNLOAD_COMPLETE',
            trackId,
            size: blob.size,
          });
        } catch {
          port.postMessage({
            type: 'DOWNLOAD_ERROR',
            error: 'QUOTA_EXCEEDED',
          });
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('[Jützlify SW] Download error:', error);
    port.postMessage({
      type: 'DOWNLOAD_ERROR',
      error: error.message,
    });
  }
}

/**
 * Remove download from cache
 */
async function removeDownloadFromCache(trackId) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  for (const request of keys) {
    if (request.url.includes(`/stream/${trackId}`)) {
      await cache.delete(request);
      console.log('[Jützlify SW] Removed from cache:', trackId);
      return;
    }
  }
}

/**
 * Pin track in cache to prevent auto-deletion
 */
async function pinTrackInCache(trackId) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  for (const request of keys) {
    if (request.url.includes(`/stream/${trackId}`)) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        const headers = new Headers(response.headers);
        headers.set('sw-pinned', 'true');

        const pinnedResponse = new Response(blob, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });

        await cache.put(request, pinnedResponse);
        console.log('[Jützlify SW] Pinned:', trackId);
      }
      return;
    }
  }
}
