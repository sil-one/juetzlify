/**
 * Download Service - Manages track downloads using IndexedDB
 * Stores download metadata separately from Service Worker cache
 */

const DB_NAME = 'juetzlify-downloads';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

// Platform-specific download limits
const PLATFORM_LIMITS = {
  ios: 10,
  android: 30,
  desktop: 50,
};

/**
 * Detect platform based on user agent
 */
function getPlatform() {
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }

  if (/android/.test(ua)) {
    return 'android';
  }

  return 'desktop';
}

/**
 * Get maximum downloads allowed for current platform
 */
export function getMaxDownloadsForPlatform() {
  const platform = getPlatform();
  return PLATFORM_LIMITS[platform];
}

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'trackId' });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        store.createIndex('visibility', 'visibility', { unique: false });
      }
    };
  });
}

/**
 * Add download metadata to IndexedDB
 */
export async function addDownload(metadata) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const download = {
      trackId: metadata.trackId,
      filename: metadata.filename,
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album || null,
      visibility: metadata.visibility,
      downloadedAt: new Date().toISOString(),
      size: metadata.size || 0,
      version: 1,
    };

    const request = store.put(download);

    request.onsuccess = () => resolve(download);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get download metadata by trackId
 */
export async function getDownload(trackId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(trackId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all downloads
 */
export async function getAllDownloads() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Remove download metadata from IndexedDB
 */
export async function removeDownload(trackId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(trackId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get total download count
 */
export async function getDownloadCount() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Verify download integrity - check if cache matches IndexedDB
 */
export async function verifyDownloadIntegrity(trackId) {
  try {
    const download = await getDownload(trackId);
    if (!download) {
      return false;
    }

    // Check if track exists in Service Worker cache
    // Match the cache name from audio-cache-sw.js
    const cache = await caches.open('juetzlify-audio-v3');
    const cached = await cache.match(`/api/stream/${trackId}`);

    if (!cached) {
      // Cache missing, remove from IndexedDB
      await removeDownload(trackId);
      console.warn(`Download ${trackId} missing from cache, removed from IndexedDB`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying download integrity:', error);
    return false;
  }
}

/**
 * Check if adding a download would exceed platform limit
 */
export async function canAddDownload() {
  const count = await getDownloadCount();
  const max = getMaxDownloadsForPlatform();
  return count < max;
}
