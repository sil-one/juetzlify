import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useFeaturedShowOverlay } from '../hooks/useFeaturedShowOverlay';
import { useDownloads } from '../contexts/DownloadsContext';
import AudioPlayer from '../components/AudioPlayer';
import TrackList from '../components/TrackList';
import Queue from '../components/Queue';
import PasswordPrompt from '../components/PasswordPrompt';
import StickyPlayerBar from '../components/StickyPlayerBar';
import FeaturedShowOverlay from '../components/FeaturedShowOverlay';
import OfflineIndicator from '../components/OfflineIndicator';
import { API_BASE_URL } from '../utils/constants';

const PrivatePage = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);

  const { syncOfflinePlays } = useDownloads();

  const {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    queue,
    isShuffleOn,
    repeatMode,
    playTrack,
    togglePlay,
    seek,
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
  } = useAudioPlayer(tracks, syncOfflinePlays);

  // Detect scroll position for sticky player
  const isScrolledPast = useScrollPosition(400);

  // Featured show overlay management
  const { shouldShowShow, selectedShow, dismissShow } = useFeaturedShowOverlay('private');

  useEffect(() => {
    if (isAuthenticated) {
      fetchTracks();
    }
  }, [isAuthenticated]);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/tracks?type=all`);
      const data = await response.json();

      if (data.success) {
        // Fix album art URLs to include backend base URL
        const tracksWithFullUrls = data.tracks.map(track => ({
          ...track,
          albumArt: track.albumArt ? API_BASE_URL.replace('/api', '') + track.albumArt : null
        }));

        setTracks(tracksWithFullUrls);
        // Load first track without autoplay
        if (tracksWithFullUrls.length > 0 && !currentTrack) {
          playTrack(tracksWithFullUrls[0], false);
        }
      } else {
        setError('Failed to load tracks');
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (password) => {
    const result = await login(password);
    if (!result.success) {
      setAuthError(result.error);
    } else {
      setAuthError(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordPrompt onSubmit={handlePasswordSubmit} error={authError} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading tracks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <OfflineIndicator />
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        audioRef={audioRef}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        isShuffleOn={isShuffleOn}
        repeatMode={repeatMode}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
      />
      <Queue
        queue={queue}
        onRemove={removeFromQueue}
        onClear={clearQueue}
        onPlayTrack={playTrack}
        onReorder={reorderQueue}
        repeatMode={repeatMode}
      />
      <div className={isScrolledPast ? 'pb-24' : ''}>
        <TrackList
          tracks={tracks}
          currentTrack={currentTrack}
          onTrackSelect={playTrack}
          onAddToQueue={addToQueue}
        />
      </div>

      {/* Sticky player bar - shows when scrolled past main player */}
      <StickyPlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        isShuffleOn={isShuffleOn}
        repeatMode={repeatMode}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        isVisible={isScrolledPast}
      />

      {/* Featured show overlay */}
      {shouldShowShow && <FeaturedShowOverlay show={selectedShow} onDismiss={dismissShow} />}
    </div>
  );
};

export default PrivatePage;
