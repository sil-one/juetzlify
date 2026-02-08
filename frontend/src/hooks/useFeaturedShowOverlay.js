import { useState, useEffect } from 'react';
import { FEATURED_SHOWS } from '../utils/featuredShows.js';
import { API_BASE_URL } from '../utils/constants.js';

const STORAGE_KEY = 'juetzlify-featured-shows';

/**
 * Hook for managing featured show overlay display
 * @param {string} pageType - 'public' or 'private'
 * @returns {Object} - { shouldShowShow, selectedShow, dismissShow, isLoading }
 */
export function useFeaturedShowOverlay(pageType) {
  const [shouldShowShow, setShouldShowShow] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const initializeShow = async () => {
      try {
        setIsLoading(true);

        // 1. Check if shows are enabled on backend for this page type
        const statusResponse = await fetch(`${API_BASE_URL}/settings/podcast-ads`);
        if (!statusResponse.ok) {
          console.warn('Failed to fetch featured shows status');
          setIsLoading(false);
          return;
        }

        const statusData = await statusResponse.json();
        const showsEnabled = statusData.podcastAdsEnabled?.[pageType];

        if (!showsEnabled) {
          // Shows disabled, don't show new one
          setIsLoading(false);
          return;
        }

        // 2. Fetch interval setting from backend
        const intervalResponse = await fetch(`${API_BASE_URL}/settings/featured-show-interval`);
        if (!intervalResponse.ok) {
          console.warn('Failed to fetch featured show interval, using default 60 minutes');
        }

        const intervalData = await intervalResponse.json();
        const intervalMinutes = intervalData.success ? intervalData.intervalMinutes : 60;
        const intervalMs = intervalMinutes * 60 * 1000; // Convert minutes to milliseconds

        // 3. Get or initialize localStorage data
        const storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
          seenShows: [],
          lastShownTimestamp: null,
          dismissedCurrentShow: false,
        };

        // 4. Check cooldown from initial page load (unless interval is 0 = every reload)
        const now = Date.now();
        if (
          intervalMinutes > 0 &&
          storageData.lastShownTimestamp &&
          now - storageData.lastShownTimestamp < intervalMs
        ) {
          // Still within cooldown period, don't show show
          setIsLoading(false);
          return;
        }

        // 5. Check if user dismissed show in this session already (only if interval > 0)
        if (intervalMinutes > 0 && storageData.dismissedCurrentShow) {
          setIsLoading(false);
          return;
        }

        // 6. Select random show, prioritizing unseen ones
        let unseenShows = FEATURED_SHOWS.filter(
          (show) => !storageData.seenShows.includes(show.filename)
        );

        // If all shows have been seen, reset and start fresh
        if (unseenShows.length === 0) {
          storageData.seenShows = [];
          unseenShows = FEATURED_SHOWS;
        }

        // Pick random from unseen shows
        const selectedShowData = unseenShows[Math.floor(Math.random() * unseenShows.length)];

        // 7. Update localStorage with this show and timestamp
        storageData.seenShows.push(selectedShowData.filename);
        // Remove duplicates (shouldn't happen but be safe)
        storageData.seenShows = [...new Set(storageData.seenShows)];
        storageData.lastShownTimestamp = now;
        storageData.dismissedCurrentShow = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

        // 8. Set UI state
        setSelectedShow(selectedShowData);
        setShouldShowShow(true);
      } catch (error) {
        console.error('Error initializing featured show overlay:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeShow();
  }, [pageType]);

  const dismissShow = () => {
    // Mark dismissed in this session
    const storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      seenShows: [],
      lastShownTimestamp: null,
      dismissedCurrentShow: false,
    };
    storageData.dismissedCurrentShow = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

    // Hide overlay
    setShouldShowShow(false);
    setDismissed(true);
  };

  return {
    shouldShowShow,
    selectedShow,
    dismissShow,
    isLoading,
  };
}
