import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

export const useAudioPlayer = (tracks = []) => {
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
  const lastBackwardTimeRef = useRef(0);
  const playRecordedRef = useRef(false);
  const playTimerRef = useRef(null);
  const shouldAutoPlayRef = useRef(true);

  // Update audio element when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const streamUrl = API_BASE_URL.replace('/api', '') + `/api/stream/${currentTrack.id}`;
      audioRef.current.src = streamUrl;
      audioRef.current.load();

      // Autoplay if shouldAutoPlay is true (user clicked), otherwise just load
      if (shouldAutoPlayRef.current) {
        audioRef.current.play().catch(error => {
          console.error('Playback error:', error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      } else {
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
        try {
          await fetch(`${API_BASE_URL}/tracks/${currentTrack.id}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visibility: currentTrack.visibility }),
          });
          playRecordedRef.current = true;
          console.log(`Play recorded: ${currentTrack.title}`);
        } catch (error) {
          console.error('Failed to record play:', error);
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
  }, [isPlaying, currentTrack]);

  const playTrack = (track, autoplay = true) => {
    shouldAutoPlayRef.current = autoplay;
    setCurrentTrack(track);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Playback error:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const playNext = () => {
    // If there's a track in the queue, play it
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(nextTrack);
      return;
    }

    // Otherwise, play next in track list
    if (!currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      playTrack(tracks[currentIndex + 1]);
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
          audioRef.current.play();
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      },
      previoustrack: () => playPrevious(),
      nexttrack: () => playNext(),
      seekto: (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
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

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
    // Update Media Session position state
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: e.target.duration || 0,
          playbackRate: e.target.playbackRate || 1,
          position: e.target.currentTime || 0
        });
      } catch {
        // Ignore errors when setting position state
      }
    }
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // Auto-play next track
    playNext();
  };

  return {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
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
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
  };
};
