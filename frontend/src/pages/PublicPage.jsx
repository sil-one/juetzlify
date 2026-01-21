import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useScrollPosition } from '../hooks/useScrollPosition';
import AudioPlayer from '../components/AudioPlayer';
import TrackList from '../components/TrackList';
import Queue from '../components/Queue';
import StickyPlayerBar from '../components/StickyPlayerBar';
import { API_BASE_URL } from '../utils/constants';

const PublicPage = () => {
  // Check if user is logged in as admin (no auth required, just checking)
  const { userRole } = useAuth('admin');
  const isAdmin = userRole === 'admin';

  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wrappedEnabled, setWrappedEnabled] = useState(false);

  const {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    queue,
    playTrack,
    togglePlay,
    seek,
    playNext,
    playPrevious,
    addToQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
  } = useAudioPlayer(tracks);

  // Detect scroll position for sticky player
  const isScrolledPast = useScrollPosition(400);

  useEffect(() => {
    fetchTracks();
    checkWrappedStatus();
  }, [isAdmin]); // Refetch when admin status changes

  const checkWrappedStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/wrapped/status`);
      const data = await response.json();
      if (data.success) {
        setWrappedEnabled(data.wrappedEnabled.public);
      }
    } catch (err) {
      console.error('Error checking wrapped status:', err);
    }
  };

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      // If admin, fetch all tracks including disabled ones
      const trackType = isAdmin ? 'admin' : 'public';
      const response = await fetch(`${API_BASE_URL}/tracks?type=${trackType}`);
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
          isAdmin={isAdmin}
        />
      </div>

      {/* Wrapped Button */}
      {wrappedEnabled && (
        <Link
          to="/wrapped"
          className="fixed bottom-24 right-6 z-50 group"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-sp-green rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative px-6 py-3 bg-gradient-to-r from-sp-green to-[#27ae60] text-sp-black font-bold rounded-full shadow-2xl hover:shadow-sp-green/50 transition-all flex items-center gap-2 hover:scale-105">
              <span className="text-2xl">🎭</span>
              <span>Jützlify Wrapped</span>
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
        isVisible={isScrolledPast}
      />
    </div>
  );
};

export default PublicPage;
