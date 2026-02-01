/**
 * Downloads Hook - Manages download state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  addDownload,
  getDownload,
  getAllDownloads,
  removeDownload as removeDownloadFromDB,
  canAddDownload,
  getMaxDownloadsForPlatform,
  verifyDownloadIntegrity,
} from '../services/downloadService';
import {
  getOfflinePlayQueue,
  saveOfflinePlayQueue,
} from '../services/offlinePlayService';
import { API_BASE_URL } from '../utils/constants';

// Download states: not_downloaded, checking, downloading, downloaded, failed
export const useDownloads = () => {
  const [downloads, setDownloads] = useState(new Map());
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Load downloads from IndexedDB on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const allDownloads = await getAllDownloads();
      const newDownloads = new Map();

      for (const download of allDownloads) {
        // Verify integrity on load
        const isValid = await verifyDownloadIntegrity(download.trackId);
        if (isValid) {
          newDownloads.set(download.trackId, {
            state: 'downloaded',
            progress: 1,
            size: download.size,
          });
        }
      }

      setDownloads(newDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const getDownloadState = useCallback(
    (trackId) => {
      const download = downloads.get(trackId);
      return download ? download.state : 'not_downloaded';
    },
    [downloads]
  );

  const getDownloadProgress = useCallback(
    (trackId) => {
      const download = downloads.get(trackId);
      return download ? download.progress : 0;
    },
    [downloads]
  );

  const downloadTrack = async (track) => {
    try {
      // Check if already downloading or downloaded
      const currentState = getDownloadState(track.id);
      if (currentState === 'downloading' || currentState === 'downloaded') {
        return;
      }

      // Check download limit
      const allowed = await canAddDownload();
      if (!allowed) {
        setShowLimitModal(true);
        return;
      }

      // Set to downloading state
      setDownloads((prev) =>
        new Map(prev).set(track.id, {
          state: 'downloading',
          progress: 0,
          size: 0,
        })
      );

      // Send message to Service Worker to download track
      const sw = await navigator.serviceWorker.ready;
      const messageChannel = new MessageChannel();

      // Listen for progress updates
      messageChannel.port1.onmessage = (event) => {
        const { type, progress, error } = event.data;

        if (type === 'DOWNLOAD_PROGRESS') {
          setDownloads((prev) =>
            new Map(prev).set(track.id, {
              state: 'downloading',
              progress,
              size: 0,
            })
          );
        } else if (type === 'DOWNLOAD_COMPLETE') {
          // Save to IndexedDB
          addDownload({
            trackId: track.id,
            filename: track.filename,
            title: track.title,
            artist: track.artist,
            album: track.album,
            visibility: track.visibility,
            size: event.data.size || 0,
          })
            .then(() => {
              setDownloads((prev) =>
                new Map(prev).set(track.id, {
                  state: 'downloaded',
                  progress: 1,
                  size: event.data.size || 0,
                })
              );
            })
            .catch((error) => {
              console.error('Failed to save download metadata:', error);
              setDownloads((prev) =>
                new Map(prev).set(track.id, {
                  state: 'failed',
                  progress: 0,
                  size: 0,
                })
              );
            });
        } else if (type === 'DOWNLOAD_ERROR') {
          console.error('Download error:', error);
          setDownloads((prev) =>
            new Map(prev).set(track.id, {
              state: 'failed',
              progress: 0,
              size: 0,
            })
          );
        }
      };

      // Start download
      sw.active.postMessage(
        {
          type: 'DOWNLOAD_TRACK',
          trackId: track.id,
          url: `${API_BASE_URL}/stream/${track.id}`,
        },
        [messageChannel.port2]
      );
    } catch (error) {
      console.error('Failed to download track:', error);
      setDownloads((prev) =>
        new Map(prev).set(track.id, {
          state: 'failed',
          progress: 0,
          size: 0,
        })
      );
    }
  };

  const removeDownload = async (trackId) => {
    try {
      // Remove from IndexedDB
      await removeDownloadFromDB(trackId);

      // Remove from Service Worker cache
      const sw = await navigator.serviceWorker.ready;
      sw.active.postMessage({
        type: 'REMOVE_DOWNLOAD',
        trackId,
      });

      // Update state
      setDownloads((prev) => {
        const newDownloads = new Map(prev);
        newDownloads.delete(trackId);
        return newDownloads;
      });

      console.log('Removed download:', trackId);
    } catch (error) {
      console.error('Failed to remove download:', error);
    }
  };

  const syncOfflinePlays = async () => {
    const queue = getOfflinePlayQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline plays...`);
    const successfulSyncs = [];

    for (const play of queue) {
      try {
        const response = await fetch(`${API_BASE_URL}/tracks/${play.trackId}/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visibility: play.visibility,
            timestamp: play.timestamp, // Preserve original timestamp
          }),
        });

        if (response.ok) {
          successfulSyncs.push(play);
        } else {
          console.error('Failed to sync play:', await response.text());
          break; // Stop on first failure, retry later
        }
      } catch (error) {
        console.error('Failed to sync play:', error);
        break; // Stop on first failure, retry later
      }
    }

    // Remove successfully synced plays
    if (successfulSyncs.length > 0) {
      const newQueue = queue.filter(
        (p) =>
          !successfulSyncs.some(
            (s) => s.trackId === p.trackId && s.timestamp === p.timestamp
          )
      );
      saveOfflinePlayQueue(newQueue);
      console.log(`✓ Synced ${successfulSyncs.length} offline plays`);
    }
  };

  return {
    downloads,
    getDownloadState,
    getDownloadProgress,
    downloadTrack,
    removeDownload,
    syncOfflinePlays,
    showLimitModal,
    setShowLimitModal,
    maxDownloads: getMaxDownloadsForPlatform(),
  };
};
