import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useFeaturedShowOverlay } from '../hooks/useFeaturedShowOverlay';
import { useDownloads } from '../contexts/DownloadsContext';
import AudioPlayer from '../components/AudioPlayer';
import TrackList from '../components/TrackList';
import Queue from '../components/Queue';
import StickyPlayerBar from '../components/StickyPlayerBar';
import FeaturedShowOverlay from '../components/FeaturedShowOverlay';
import WelcomeBanner from '../components/WelcomeBanner';
import CopyrightFooter from '../components/CopyrightFooter';
import LyricsOverlay from '../components/LyricsOverlay';
import OfflineIndicator from '../components/OfflineIndicator';
import { API_BASE_URL } from '../utils/constants';

const PublicPage = () => {
  // Check if user is logged in as admin (no auth required, just checking)
  const { userRole } = useAuth('admin');
  const isAdmin = userRole === 'admin';

  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lyricsOpen, setLyricsOpen] = useState(false);

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
  const { shouldShowShow, selectedShow, dismissShow } = useFeaturedShowOverlay('public');

  useEffect(() => {
    fetchTracks();
  }, [isAdmin]); // Refetch when admin status changes

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
        onToggleLyrics={() => setLyricsOpen(!lyricsOpen)}
        lyricsOpen={lyricsOpen}
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
          isAdmin={isAdmin}
        />
        <CopyrightFooter />
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

      {/* Welcome banner */}
      <WelcomeBanner />

      {/* Lyrics overlay */}
      <LyricsOverlay
        track={currentTrack}
        isOpen={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
      />
    </div>
  );
};

export default PublicPage;
