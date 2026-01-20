import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useScrollPosition } from '../hooks/useScrollPosition';
import AudioPlayer from '../components/AudioPlayer';
import TrackList from '../components/TrackList';
import Queue from '../components/Queue';
import StickyPlayerBar from '../components/StickyPlayerBar';
import { API_BASE_URL } from '../utils/constants';

const PublicPage = () => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/tracks?type=public`);
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
        isVisible={isScrolledPast}
      />
    </div>
  );
};

export default PublicPage;
