import { useState, useEffect } from 'react';
import { PODCAST_ADS } from '../utils/podcastAds.js';
import { API_BASE_URL } from '../utils/constants.js';

const STORAGE_KEY = 'juetzlify-podcast-ads';
const ONE_HOUR_MS = 3600000; // 1 hour in milliseconds

/**
 * Hook for managing podcast ad overlay display
 * @param {string} pageType - 'public' or 'private'
 * @returns {Object} - { shouldShowAd, selectedAd, dismissAd, isLoading }
 */
export function useAdOverlay(pageType) {
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const initializeAd = async () => {
      try {
        setIsLoading(true);

        // 1. Check if ads are enabled on backend for this page type
        const statusResponse = await fetch(`${API_BASE_URL}/admin/podcast-ads/status`);
        if (!statusResponse.ok) {
          console.warn('Failed to fetch podcast ads status');
          setIsLoading(false);
          return;
        }

        const statusData = await statusResponse.json();
        const adsEnabled = statusData.podcastAdsEnabled?.[pageType];

        if (!adsEnabled) {
          // Ads disabled, don't show new ad
          setIsLoading(false);
          return;
        }

        // 2. Get or initialize localStorage data
        const storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
          seenAds: [],
          lastShownTimestamp: null,
          dismissedCurrentAd: false,
        };

        // 3. Check 1-hour cooldown from initial page load
        const now = Date.now();
        if (
          storageData.lastShownTimestamp &&
          now - storageData.lastShownTimestamp < ONE_HOUR_MS
        ) {
          // Still within cooldown period, don't show ad
          setIsLoading(false);
          return;
        }

        // 4. Check if user dismissed ad in this session already
        if (storageData.dismissedCurrentAd) {
          setIsLoading(false);
          return;
        }

        // 5. Select random ad, prioritizing unseen ones
        let unseenAds = PODCAST_ADS.filter(
          (ad) => !storageData.seenAds.includes(ad.filename)
        );

        // If all ads have been seen, reset and start fresh
        if (unseenAds.length === 0) {
          storageData.seenAds = [];
          unseenAds = PODCAST_ADS;
        }

        // Pick random from unseen ads
        const selectedAdData = unseenAds[Math.floor(Math.random() * unseenAds.length)];

        // 6. Update localStorage with this ad and timestamp
        storageData.seenAds.push(selectedAdData.filename);
        // Remove duplicates (shouldn't happen but be safe)
        storageData.seenAds = [...new Set(storageData.seenAds)];
        storageData.lastShownTimestamp = now;
        storageData.dismissedCurrentAd = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

        // 7. Set UI state
        setSelectedAd(selectedAdData);
        setShouldShowAd(true);
      } catch (error) {
        console.error('Error initializing ad overlay:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAd();
  }, [pageType]);

  const dismissAd = () => {
    // Mark dismissed in this session
    const storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      seenAds: [],
      lastShownTimestamp: null,
      dismissedCurrentAd: false,
    };
    storageData.dismissedCurrentAd = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

    // Hide overlay
    setShouldShowAd(false);
    setDismissed(true);
  };

  return {
    shouldShowAd,
    selectedAd,
    dismissAd,
    isLoading,
  };
}
