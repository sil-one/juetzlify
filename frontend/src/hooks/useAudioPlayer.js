import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

export const useAudioPlayer = (tracks = []) => {
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const lastBackwardTimeRef = useRef(0);

  // Update audio element when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const streamUrl = API_BASE_URL.replace('/api', '') + `/api/stream/${currentTrack.id}`;
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      audioRef.current.play().catch(error => {
        console.error('Playback error:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playTrack = (track) => {
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
    if (!currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      playTrack(tracks[currentIndex + 1]);
    }
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

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
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
    playTrack,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrevious,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
  };
};
