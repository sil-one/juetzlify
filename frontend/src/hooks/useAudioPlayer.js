import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { useOnlineStatus } from './useOnlineStatus';
import { queueOfflinePlay } from '../services/offlinePlayService';

export const useAudioPlayer = (tracks = [], syncOfflinePlays) => {
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [queue, setQueue] = useState(() => {
    // Load queue from localStorage on mount
    try {
      const saved = localStorage.getItem('juetzlify-queue');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load queue from localStorage:', error);
      return [];
    }
  });
  const [isShuffleOn, setIsShuffleOn] = useState(() => {
    try {
      const saved = localStorage.getItem('juetzlify-shuffle');
      return saved === 'true';
    } catch (error) {
      console.error('Failed to load shuffle state from localStorage:', error);
      return false;
    }
  });
  const [repeatMode, setRepeatMode] = useState(() => {
    try {
      const saved = localStorage.getItem('juetzlify-repeat');
      // Migrate old boolean values to new mode system
      if (saved === 'true') return 'all';
      if (saved === 'false') return 'off';
      // Valid modes: 'off', 'all', 'queue', 'one'
      return ['off', 'all', 'queue', 'one'].includes(saved) ? saved : 'off';
    } catch (error) {
      console.error('Failed to load repeat state from localStorage:', error);
      return 'off';
    }
  });
  const [playCycle, setPlayCycle] = useState(0);
  const lastBackwardTimeRef = useRef(0);
  const playRecordedRef = useRef(false);
  const playTimerRef = useRef(null);
  const shouldAutoPlayRef = useRef(true);
  const changingTrackRef = useRef(false);
  const lastTimeUpdateRef = useRef(0);
  const lastPositionUpdateRef = useRef(0);
  const isOnline = useOnlineStatus();

  // Update audio element when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      // Suppress handleAudioPause during source change (old source fires pause)
      changingTrackRef.current = true;

      const streamUrl = API_BASE_URL.replace('/api', '') + `/api/stream/${currentTrack.id}`;
      audioRef.current.src = streamUrl;
      audioRef.current.load();

      // Autoplay if shouldAutoPlay is true (user clicked), otherwise just load
      if (shouldAutoPlayRef.current) {
        audioRef.current.play().catch(error => {
          console.error('Playback error:', error);
          changingTrackRef.current = false;
          setIsPlaying(false);
        });
        setIsPlaying(true);
      } else {
        changingTrackRef.current = false;
        setIsPlaying(false);
        // Reset to true after initial load
        shouldAutoPlayRef.current = true;
      }
    }
  }, [currentTrack]);

  // Media Session API for lock screen display
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown Track',
      artist: currentTrack.artist || 'Unknown Artist',
      album: currentTrack.album || 'Unknown Album',
      artwork: currentTrack.albumArt ? [
        { src: currentTrack.albumArt, sizes: '512x512', type: 'image/jpeg' }
      ] : []
    });
  }, [currentTrack]);

  // Sync Media Session playback state with component state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (isPlaying) {
      navigator.mediaSession.playbackState = 'playing';
    } else {
      navigator.mediaSession.playbackState = 'paused';
    }

    // Update position state whenever play state changes
    if (audioRef.current) {
      updateMediaSessionPosition(audioRef.current);
    }
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('juetzlify-queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save queue to localStorage:', error);
    }
  }, [queue]);

  // Save shuffle state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('juetzlify-shuffle', isShuffleOn.toString());
    } catch (error) {
      console.error('Failed to save shuffle state to localStorage:', error);
    }
  }, [isShuffleOn]);

  // Save repeat mode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('juetzlify-repeat', repeatMode);
    } catch (error) {
      console.error('Failed to save repeat mode to localStorage:', error);
    }
  }, [repeatMode]);

  // Sync offline plays when reconnecting
  useEffect(() => {
    if (isOnline && syncOfflinePlays) {
      syncOfflinePlays();
    }
  }, [isOnline, syncOfflinePlays]);

  // Snap currentTime to real position when user returns to the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        updateMediaSessionPosition(audioRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard shortcut: spacebar to play/pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle spacebar
      if (e.code !== 'Space' && e.key !== ' ') return;

      // Don't trigger if user is typing in an input field
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
        return;
      }

      // Prevent default scrolling behavior
      e.preventDefault();

      // Toggle play/pause
      if (audioRef.current && currentTrack) {
        if (isPlaying) {
          audioRef.current.pause();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        } else {
          audioRef.current.play().catch(error => {
            console.error('Playback error:', error);
          });
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        }
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTrack]);

  // Play tracking: Record play after 15 seconds
  useEffect(() => {
    // Clear any existing timer
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    // Reset play recorded flag when track changes
    if (currentTrack) {
      playRecordedRef.current = false;
    }

    // Start timer when playing
    if (isPlaying && currentTrack && !playRecordedRef.current) {
      playTimerRef.current = setTimeout(async () => {
        const playData = {
          trackId: currentTrack.id,
          filename: currentTrack.filename,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          visibility: currentTrack.visibility,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        };

        if (isOnline) {
          try {
            await fetch(`${API_BASE_URL}/tracks/${currentTrack.id}/play`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                visibility: currentTrack.visibility,
                timestamp: playData.timestamp,
              }),
            });
            playRecordedRef.current = true;
            console.log(`Play recorded: ${currentTrack.title}`);
          } catch (error) {
            console.error('Failed to record play, queuing offline:', error);
            // Network error - queue offline
            queueOfflinePlay(playData);
            playRecordedRef.current = true; // Don't retry this session
          }
        } else {
          // Offline - queue immediately
          console.log(`Offline - queuing play: ${currentTrack.title}`);
          queueOfflinePlay(playData);
          playRecordedRef.current = true;
        }
      }, 15000); // 15 seconds
    }

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, currentTrack, isOnline, playCycle]);

  const playTrack = (track, autoplay = true) => {
    shouldAutoPlayRef.current = autoplay;
    setCurrentTrack(track);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      updateMediaSessionPosition(audio);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
          updateMediaSessionPosition(audio);
        })
        .catch(() => {
          // iOS recovery: reload from current position and retry
          const pos = audio.currentTime;
          audio.load();
          audio.currentTime = pos;
          audio.play()
            .then(() => {
              setIsPlaying(true);
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
              updateMediaSessionPosition(audio);
            })
            .catch(err => {
              console.error('Playback failed after reload:', err);
              setIsPlaying(false);
            });
        });
    }
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      // Immediately update Media Session position state after seeking
      updateMediaSessionPosition(audioRef.current);
    }
  };

  const playNext = () => {
    // If repeat one is active, replay current track
    if (repeatMode === 'one' && currentTrack) {
      playTrack(currentTrack);
      return;
    }

    // If there's a track in the queue, play it
    if (queue.length > 0) {
      if (isShuffleOn) {
        // Pick random track from queue
        const randomIndex = Math.floor(Math.random() * queue.length);
        const nextTrack = queue[randomIndex];
        // Don't remove from queue if repeat queue is on
        if (repeatMode !== 'queue') {
          setQueue(prev => prev.filter((_, i) => i !== randomIndex));
        }
        playTrack(nextTrack);
      } else {
        // Play first track in queue
        const nextTrack = queue[0];
        // Don't remove from queue if repeat queue is on
        if (repeatMode !== 'queue') {
          setQueue(prev => prev.slice(1));
        } else {
          // Move first track to end of queue (keep looping)
          setQueue(prev => [...prev.slice(1), prev[0]]);
        }
        playTrack(nextTrack);
      }
      return;
    }

    // Otherwise, play next in track list
    if (tracks.length === 0) return;

    if (isShuffleOn) {
      // Pick random track from tracks (excluding current if not repeating)
      const availableTracks = currentTrack && repeatMode !== 'all'
        ? tracks.filter(t => t.id !== currentTrack.id)
        : tracks;
      if (availableTracks.length > 0) {
        const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
        playTrack(randomTrack);
      }
    } else {
      // Play next track in order
      if (!currentTrack) {
        playTrack(tracks[0]);
        return;
      }
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % tracks.length;

      // Only play next if we're not at the end OR if repeat all is on
      if (currentIndex < tracks.length - 1 || repeatMode === 'all') {
        playTrack(tracks[nextIndex]);
      }
    }
  };

  const addToQueue = (track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const reorderQueue = (fromIndex, toIndex) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      return newQueue;
    });
  };

  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0 || !audioRef.current) return;

    const now = Date.now();
    const timeSinceLastBackward = now - lastBackwardTimeRef.current;

    // If we're more than 3 seconds into the track OR it's been less than 1 second since last backward press
    // go to start of current track
    if (currentTime > 3 || timeSinceLastBackward > 1000) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      lastBackwardTimeRef.current = now;
    } else {
      // Go to previous track
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      if (currentIndex > 0) {
        playTrack(tracks[currentIndex - 1]);
      }
      lastBackwardTimeRef.current = 0;
    }
  };

  // Media Session action handlers (must be after playNext and playPrevious are defined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers = {
      play: () => {
        if (audioRef.current) {
          const audio = audioRef.current;
          // Don't set isPlaying here — the audio element's 'playing' event
          // is the source of truth (iOS can resolve play() without actually playing).
          audio.play().catch(() => {
            // Reload from the current position and retry
            const pos = audio.currentTime;
            audio.load();
            audio.currentTime = pos;
            audio.play().catch(err => {
              console.error('Media Session play failed after reload:', err);
            });
          });
        }
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          // State synced by audio 'pause' event handler
        }
      },
      previoustrack: () => playPrevious(),
      nexttrack: () => playNext(),
      seekto: (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
          updateMediaSessionPosition(audioRef.current);
        }
      },
    };

    for (const [action, handler] of Object.entries(actionHandlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.log(`Media Session action "${action}" not supported`, err);
      }
    }

    return () => {
      for (const action of Object.keys(actionHandlers)) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [currentTrack, tracks, queue, currentTime]);

  // Helper function to update Media Session position state
  const updateMediaSessionPosition = (audioElement) => {
    if (!audioElement || !('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) {
      return;
    }

    try {
      navigator.mediaSession.setPositionState({
        duration: audioElement.duration || 0,
        playbackRate: audioElement.playbackRate || 1,
        position: audioElement.currentTime || 0
      });
    } catch (error) {
      // Some browsers may throw errors, especially when position is NaN
      if (error.name !== 'InvalidStateError') {
        console.warn('Failed to update Media Session position state:', error);
      }
    }
  };

  const handleTimeUpdate = (e) => {
    const now = Date.now();

    // Skip UI state updates when page is hidden (screen off / app backgrounded)
    // to avoid unnecessary React re-renders that drain battery.
    if (!document.hidden && now - lastTimeUpdateRef.current >= 1000) {
      setCurrentTime(e.target.currentTime);
      lastTimeUpdateRef.current = now;
    }

    // Update lock screen position every ~5 seconds (still needed when backgrounded)
    if (now - lastPositionUpdateRef.current >= 5000) {
      updateMediaSessionPosition(e.target);
      lastPositionUpdateRef.current = now;
    }
  };

  // Source-of-truth event handlers for actual audio element state.
  // These catch iOS silently pausing after play() resolves.
  const handleAudioPlaying = () => {
    changingTrackRef.current = false;
    setIsPlaying(true);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  };

  const handleAudioPause = () => {
    // Ignore pause events during track changes (old source fires pause when swapped)
    if (changingTrackRef.current) return;
    // Ignore if audio ended — handleEnded manages that flow
    if (audioRef.current?.ended) return;
    setIsPlaying(false);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
    // Update Media Session position state when metadata is loaded
    updateMediaSessionPosition(e.target);
  };

  const handleEnded = () => {
    // Repeat one: restart immediately without toggling isPlaying off/on,
    // so the play tracking useEffect sees a fresh timer cycle
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      playRecordedRef.current = false;
      setPlayCycle(c => c + 1); // Force play tracking effect to restart its 15s timer
      audioRef.current.play().catch(error => {
        console.error('Repeat one playback error:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      return;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    // Update Media Session to paused state
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    // Auto-play next track (respects repeat mode in playNext logic)
    // Repeat all: continue to next track (wraps around)
    // Repeat queue: loop queue forever
    // Repeat off: play next if available, stop at end
    if (queue.length > 0 || repeatMode === 'all' || repeatMode === 'queue' || isShuffleOn) {
      playNext();
    } else {
      // Normal behavior: play next track or stop at end
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex < tracks.length - 1) {
        playNext();
      }
    }
  };

  const toggleShuffle = () => {
    setIsShuffleOn(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      // Cycle through: off -> all -> queue -> one -> off
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'queue';
      if (prev === 'queue') return 'one';
      return 'off';
    });
  };

  return {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    isShuffleOn,
    repeatMode,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrevious,
    addToQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    toggleShuffle,
    toggleRepeat,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleAudioPlaying,
    handleAudioPause,
  };
};
