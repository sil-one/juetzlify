import { useState, useEffect } from 'react';

/**
 * Hook for interacting with the audio cache service worker
 */
export const useAudioCache = () => {
  const [cacheInfo, setCacheInfo] = useState({
    isSupported: false,
    isActive: false,
    cachedTracks: 0,
    maxTracks: 50,
  });

  useEffect(() => {
    checkServiceWorker();
  }, []);

  const checkServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log('Service Worker not registered');
      return;
    }

    setCacheInfo(prev => ({
      ...prev,
      isSupported: true,
      isActive: registration.active !== null,
    }));

    // Get cache info
    await updateCacheInfo();
  };

  const updateCacheInfo = async () => {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    try {
      const messageChannel = new MessageChannel();

      const response = await new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_INFO' },
          [messageChannel.port2]
        );
      });

      if (response.success) {
        setCacheInfo(prev => ({
          ...prev,
          cachedTracks: response.cachedTracks,
          maxTracks: response.maxTracks,
        }));
      }
    } catch (error) {
      console.error('Failed to get cache info:', error);
    }
  };

  const clearCache = async () => {
    if (!navigator.serviceWorker.controller) {
      console.error('Service Worker not active');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();

      const response = await new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });

      if (response.success) {
        await updateCacheInfo();
        console.log('Audio cache cleared');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  };

  return {
    cacheInfo,
    clearCache,
    updateCacheInfo,
  };
};
