import { useState, useEffect, useRef } from 'react';
import { FEATURED_SHOWS } from '../utils/featuredShows.js';
import { API_BASE_URL } from '../utils/constants.js';

const STORAGE_KEY = 'juetzlify-featured-shows';

/**
 * Hook for managing featured show overlay display
 * Shows overlay at intervals relative to user's visit time
 * Persists across page reloads and works during active use
 *
 * @param {string} pageType - 'public' or 'private'
 * @returns {Object} - { shouldShowShow, selectedShow, dismissShow, isLoading }
 */
export function useFeaturedShowOverlay(pageType) {
  const [shouldShowShow, setShouldShowShow] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showsEnabled, setShowsEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  const nextTriggerTimeRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Initialize settings and calculate next trigger time
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);

        // 1. Check if shows are enabled on backend for this page type
        const statusResponse = await fetch(`${API_BASE_URL}/settings/podcast-ads`);
        if (!statusResponse.ok) {
          console.warn('[Featured Shows] Failed to fetch status');
          setIsLoading(false);
          return;
        }

        const statusData = await statusResponse.json();
        const enabled = statusData.podcastAdsEnabled?.[pageType];
        setShowsEnabled(enabled);

        if (!enabled) {
          console.log('[Featured Shows] Disabled for', pageType);
          setIsLoading(false);
          return;
        }

        // 2. Fetch interval setting from backend
        const intervalResponse = await fetch(`${API_BASE_URL}/settings/featured-show-interval`);
        if (!intervalResponse.ok) {
          console.warn('[Featured Shows] Failed to fetch interval, using default 60 minutes');
        }

        const intervalData = await intervalResponse.json();
        const minutes = intervalData.success ? intervalData.intervalMinutes : 60;
        setIntervalMinutes(minutes);

        // 3. Get localStorage data
        let storageData;
        try {
          storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            seenShows: [],
            nextTriggerTime: null,
            intervalUsed: null,
          };
        } catch (error) {
          console.warn('[Featured Shows] Invalid localStorage data, resetting:', error);
          storageData = {
            seenShows: [],
            nextTriggerTime: null,
            intervalUsed: null,
          };
        }

        // 4. Calculate next trigger time
        const now = Date.now();
        const intervalMs = minutes * 60 * 1000;
        let nextTrigger;

        if (minutes === 0) {
          // Special case: interval 0 means show on every reload (immediately)
          nextTrigger = now;
        } else if (!storageData.nextTriggerTime || storageData.nextTriggerTime <= now) {
          // No trigger time set OR it's in the past → calculate new one
          nextTrigger = now + intervalMs;
          console.log('[Featured Shows] Calculated new trigger time:', new Date(nextTrigger).toLocaleString());
        } else {
          // Use existing future trigger time (timer continues from where it left off)
          nextTrigger = storageData.nextTriggerTime;
          const minutesRemaining = Math.round((nextTrigger - now) / 60000);
          console.log(`[Featured Shows] Continuing timer, ${minutesRemaining} min remaining until`, new Date(nextTrigger).toLocaleTimeString());
        }

        // 5. Save to localStorage and state
        storageData.nextTriggerTime = nextTrigger;
        storageData.intervalUsed = minutes;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
        nextTriggerTimeRef.current = nextTrigger;

        // 6. If interval is 0, show immediately
        if (minutes === 0) {
          showRandomShow();
        }
      } catch (error) {
        console.error('[Featured Shows] Error initializing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, [pageType]);

  // Handle interval changes
  const handleIntervalChange = (newInterval) => {
    const now = Date.now();
    const newIntervalMs = newInterval * 60 * 1000;

    // Load current localStorage data
    let storageData;
    try {
      storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        seenShows: [],
        nextTriggerTime: null,
        intervalUsed: intervalMinutes,
      };
    } catch (error) {
      console.warn('[Featured Shows] Invalid localStorage during interval change:', error);
      storageData = {
        seenShows: [],
        nextTriggerTime: null,
        intervalUsed: intervalMinutes,
      };
    }

    const currentNextTrigger = storageData.nextTriggerTime;

    if (!currentNextTrigger) {
      // No trigger set yet, just update interval
      setIntervalMinutes(newInterval);
      return;
    }

    // Calculate time remaining with OLD interval
    const timeRemaining = currentNextTrigger - now;

    let newNextTrigger;

    if (timeRemaining > newIntervalMs) {
      // Interval decreased and would show sooner → recalculate
      newNextTrigger = now + newIntervalMs;
      console.log(`[Featured Shows] Interval decreased, showing sooner at ${new Date(newNextTrigger).toLocaleTimeString()}`);
    } else {
      // Interval increased OR already close to trigger → keep existing time
      newNextTrigger = currentNextTrigger;
      console.log(`[Featured Shows] Keeping existing trigger time at ${new Date(newNextTrigger).toLocaleTimeString()}`);
    }

    // Update localStorage with new trigger time and interval
    storageData.nextTriggerTime = newNextTrigger;
    storageData.intervalUsed = newInterval;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

    // Update state
    nextTriggerTimeRef.current = newNextTrigger;
    setIntervalMinutes(newInterval);
  };

  // Function to select and show a random show
  const showRandomShow = () => {
    try {
      // Get localStorage data
      let storageData;
      try {
        storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
          seenShows: [],
          nextTriggerTime: null,
          intervalUsed: intervalMinutes,
        };
      } catch (error) {
        console.warn('[Featured Shows] Invalid localStorage during show:', error);
        storageData = {
          seenShows: [],
          nextTriggerTime: null,
          intervalUsed: intervalMinutes,
        };
      }

      // Select random show, prioritizing unseen ones
      let unseenShows = FEATURED_SHOWS.filter(
        (show) => !storageData.seenShows.includes(show.filename)
      );

      // If all shows have been seen, reset and start fresh
      if (unseenShows.length === 0) {
        console.log('[Featured Shows] All shows seen, resetting cycle');
        storageData.seenShows = [];
        unseenShows = FEATURED_SHOWS;
      }

      // Pick random from unseen shows
      const selectedShowData = unseenShows[Math.floor(Math.random() * unseenShows.length)];
      console.log('[Featured Shows] Selected show:', selectedShowData.alt);

      // Update localStorage with this show (but don't set nextTriggerTime here - will be set on dismiss)
      storageData.seenShows.push(selectedShowData.filename);
      storageData.seenShows = [...new Set(storageData.seenShows)]; // Remove duplicates
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

      // Show overlay
      setSelectedShow(selectedShowData);
      setShouldShowShow(true);
    } catch (error) {
      console.error('[Featured Shows] Error showing random show:', error);
    }
  };

  // Timer to check if it's time to show overlay and detect interval changes
  useEffect(() => {
    if (!showsEnabled || isLoading || intervalMinutes === 0) {
      return;
    }

    // Check every 60 seconds (1 minute)
    checkIntervalRef.current = setInterval(async () => {
      const now = Date.now();

      // 1. Check if interval has changed in admin panel
      try {
        const response = await fetch(`${API_BASE_URL}/settings/featured-show-interval`);
        if (response.ok) {
          const data = await response.json();
          const newInterval = data.intervalMinutes;

          if (newInterval !== intervalMinutes) {
            console.log(`[Featured Shows] Interval changed: ${intervalMinutes} → ${newInterval} min`);
            handleIntervalChange(newInterval);
            return; // Skip time check this iteration, will check next minute
          }
        }
      } catch (error) {
        console.warn('[Featured Shows] Failed to check interval, using cached value:', error);
      }

      // 2. Check if it's time to show overlay
      if (nextTriggerTimeRef.current && now >= nextTriggerTimeRef.current) {
        console.log('[Featured Shows] Time reached, showing overlay');
        showRandomShow();
      }
    }, 60000); // 60 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [showsEnabled, isLoading, intervalMinutes]);

  // Cross-tab synchronization using storage event
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const newData = JSON.parse(event.newValue);

          // Another tab updated nextTriggerTime → sync our timer
          if (newData.nextTriggerTime && newData.nextTriggerTime !== nextTriggerTimeRef.current) {
            nextTriggerTimeRef.current = newData.nextTriggerTime;
            console.log('[Featured Shows] Synced trigger time from another tab:', new Date(newData.nextTriggerTime).toLocaleString());
          }

          // Sync interval if changed
          if (newData.intervalUsed && newData.intervalUsed !== intervalMinutes) {
            setIntervalMinutes(newData.intervalUsed);
            console.log('[Featured Shows] Synced interval from another tab:', newData.intervalUsed, 'min');
          }
        } catch (error) {
          console.warn('[Featured Shows] Invalid storage event data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [intervalMinutes]);

  // Dismiss handler - calculates next trigger time
  const dismissShow = () => {
    const now = Date.now();
    const intervalMs = intervalMinutes * 60 * 1000;
    const nextTrigger = now + intervalMs;

    console.log('[Featured Shows] Dismissed. Next overlay at:', new Date(nextTrigger).toLocaleString());

    // Update localStorage
    let storageData;
    try {
      storageData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { seenShows: [] };
    } catch (error) {
      console.warn('[Featured Shows] Invalid localStorage during dismiss:', error);
      storageData = { seenShows: [] };
    }

    storageData.nextTriggerTime = nextTrigger;
    storageData.intervalUsed = intervalMinutes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

    // Update state
    nextTriggerTimeRef.current = nextTrigger;
    setShouldShowShow(false);
  };

  return {
    shouldShowShow,
    selectedShow,
    dismissShow,
    isLoading,
  };
}
