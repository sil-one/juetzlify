import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [wrappedEnabled, setWrappedEnabled] = useState(false);

  const { syncOfflinePlays } = useDownloads();

  const {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    queue,
    isShuffleOn,
    isRepeatOn,
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
      checkWrappedStatus();
    }
  }, [isAuthenticated]);

  const checkWrappedStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/wrapped/status`);
      const data = await response.json();
      if (data.success) {
        setWrappedEnabled(data.wrappedEnabled.private);
      }
    } catch (err) {
      console.error('Error checking wrapped status:', err);
    }
  };

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
        isRepeatOn={isRepeatOn}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
      />
      <Queue
        queue={queue}
        onRemove={removeFromQueue}
        onClear={clearQueue}
        onPlayTrack={playTrack}
        onReorder={reorderQueue}
      />
      <div className={isScrolledPast ? 'pb-24' : ''}>
        <TrackList
          tracks={tracks}
          currentTrack={currentTrack}
          onTrackSelect={playTrack}
          onAddToQueue={addToQueue}
        />
      </div>

      {/* Wrapped Button */}
      {wrappedEnabled && (
        <Link
          to="/wrapped-intern"
          className="fixed bottom-24 right-6 z-50 group"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-2xl hover:shadow-blue-400/50 transition-all flex items-center gap-2 hover:scale-105">
              <span className="text-2xl">🎭</span>
              <span>Jützli Wrapped</span>
            </div>
          </div>
        </Link>
      )}

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
        isRepeatOn={isRepeatOn}
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
