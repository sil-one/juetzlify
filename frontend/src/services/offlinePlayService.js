/**
 * Offline Play Service - Manages queued plays when offline
 * Uses localStorage to persist plays until they can be synced
 */

const STORAGE_KEY = 'juetzlify-offline-plays';

/**
 * Queue a play for later synchronization
 */
export function queueOfflinePlay(playData) {
  try {
    const queue = getOfflinePlayQueue();
    queue.push({
      trackId: playData.trackId,
      filename: playData.filename,
      title: playData.title,
      artist: playData.artist,
      album: playData.album || null,
      visibility: playData.visibility,
      timestamp: playData.timestamp,
      date: playData.date,
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    console.log('Queued offline play:', playData.title);
  } catch (error) {
    console.error('Failed to queue offline play:', error);
  }
}

/**
 * Get all queued offline plays
 */
export function getOfflinePlayQueue() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline play queue:', error);
    return [];
  }
}

/**
 * Save the offline play queue
 */
export function saveOfflinePlayQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save offline play queue:', error);
  }
}

/**
 * Clear all queued offline plays
 */
export function clearOfflinePlayQueue() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared offline play queue');
  } catch (error) {
    console.error('Failed to clear offline play queue:', error);
  }
}

/**
 * Remove a specific play from the queue
 */
export function removePlayFromQueue(play) {
  try {
    const queue = getOfflinePlayQueue();
    const newQueue = queue.filter(
      (p) =>
        !(p.trackId === play.trackId && p.timestamp === play.timestamp)
    );
    saveOfflinePlayQueue(newQueue);
  } catch (error) {
    console.error('Failed to remove play from queue:', error);
  }
}
