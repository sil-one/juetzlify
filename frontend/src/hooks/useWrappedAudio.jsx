import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';

/**
 * Custom hook for wrapped background music with crossfading
 *
 * Plays intro music (La Musica Del Gatto) until TopTrackSlide,
 * then crossfades to user's #1 most-played track.
 *
 * @param {Object} options
 * @param {Object} options.statistics - Wrapped statistics data
 * @param {number} options.currentSlide - Current slide index
 * @param {number} options.topTrackSlideIndex - Index where top track should start (6 for public, 4 for private)
 * @param {string} options.trackType - 'public' or 'private'
 * @param {boolean} options.enabled - Whether audio should be active
 * @returns {Object} { audioElements: JSX, autoplayBlocked: boolean, manualPlay: function }
 */
export default function useWrappedAudio({
  statistics,
  currentSlide,
  topTrackSlideIndex,
  trackType,
  enabled
}) {
  // Audio element refs
  const introAudioRef = useRef(null);
  const topAudioRef = useRef(null);

  // Web Audio API refs
  const audioContextRef = useRef(null);
  const introGainRef = useRef(null);
  const topGainRef = useRef(null);

  // State
  const [introTrackId, setIntroTrackId] = useState(null);
  const [topTrackId, setTopTrackId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState('intro'); // 'intro' or 'top'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Web Audio API context and gain nodes
  useEffect(() => {
    if (!enabled) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create gain nodes for crossfading
      const introGain = audioContext.createGain();
      const topGain = audioContext.createGain();

      introGain.gain.value = 0.85; // 85% volume
      topGain.gain.value = 0.01; // Start silent

      introGainRef.current = introGain;
      topGainRef.current = topGain;

      return () => {
        // Cleanup: disconnect nodes and close context
        if (introGainRef.current) introGainRef.current.disconnect();
        if (topGainRef.current) topGainRef.current.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
    }
  }, [enabled]);

  // Connect audio elements to Web Audio API when refs are ready
  useEffect(() => {
    if (!audioContextRef.current || !introAudioRef.current || !topAudioRef.current) return;
    if (!introGainRef.current || !topGainRef.current) return;

    try {
      const audioContext = audioContextRef.current;

      // Connect intro audio
      const introSource = audioContext.createMediaElementSource(introAudioRef.current);
      introSource.connect(introGainRef.current);
      introGainRef.current.connect(audioContext.destination);

      // Connect top track audio
      const topSource = audioContext.createMediaElementSource(topAudioRef.current);
      topSource.connect(topGainRef.current);
      topGainRef.current.connect(audioContext.destination);
    } catch (error) {
      // MediaElementSource already created - ignore
      console.debug('Audio sources already connected');
    }
  }, [introTrackId, topTrackId]);

  // Resolve La Musica Del Gatto track ID - search both public and private tracks
  useEffect(() => {
    if (!enabled) return;

    async function resolveIntroTrack() {
      try {
        // Fetch both public and private tracks to find intro regardless of visibility
        const [publicRes, privateRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tracks?type=public`),
          fetch(`${API_BASE_URL}/tracks?type=private`),
        ]);

        const allTracks = [];
        if (publicRes.ok) {
          const data = await publicRes.json();
          allTracks.push(...(data.tracks || []));
        }
        if (privateRes.ok) {
          const data = await privateRes.json();
          allTracks.push(...(data.tracks || []));
        }

        // Search flexibly for La Musica del Gatto (case-insensitive, handles spaces/underscores)
        const introTrack = allTracks.find(t => {
          const filename = t.filename.toLowerCase();
          return filename.includes('musica') && filename.includes('gatto');
        });

        if (introTrack) {
          console.log('[Wrapped Audio] Found intro track:', introTrack.filename);
          setIntroTrackId(introTrack.id);
        } else {
          console.error('La Musica del Gatto not found in track list. Available tracks:',
            allTracks.map(t => t.filename).join(', '));
        }
      } catch (error) {
        console.error('Failed to resolve intro track:', error);
      }
    }

    resolveIntroTrack();
  }, [enabled]);

  // Extract top track ID from statistics
  useEffect(() => {
    if (!statistics || !statistics.topTracks || statistics.topTracks.length === 0) {
      console.warn('No top tracks available in statistics');
      return;
    }

    const topTrack = statistics.topTracks[0];
    if (topTrack && topTrack.trackId) {
      setTopTrackId(topTrack.trackId);
    } else {
      console.warn('Top track missing trackId');
    }
  }, [statistics]);

  // Autoplay intro track when ready
  useEffect(() => {
    if (!introAudioRef.current || !introTrackId || !enabled) return;

    const playIntro = async () => {
      try {
        await introAudioRef.current.play();
        setIsPlaying(true);
        setAutoplayBlocked(false);
      } catch (error) {
        console.warn('Autoplay blocked:', error);
        setAutoplayBlocked(true);
      }
    };

    playIntro();
  }, [introTrackId, enabled]);

  // Manual play function for autoplay fallback
  const manualPlay = useCallback(async () => {
    // Determine which audio to play based on current slide
    const shouldPlayTop = currentSlide >= topTrackSlideIndex;
    const audioToPlay = shouldPlayTop ? topAudioRef.current : introAudioRef.current;

    if (!audioToPlay) {
      console.error('No audio element available to play');
      return;
    }

    try {
      await audioToPlay.play();
      setIsPlaying(true);
      setAutoplayBlocked(false);
      setCurrentAudio(shouldPlayTop ? 'top' : 'intro');
      console.log(`Manual play started: ${shouldPlayTop ? 'top track' : 'intro track'}`);
    } catch (error) {
      console.error('Manual play failed:', error);
    }
  }, [currentSlide, topTrackSlideIndex]);

  // Crossfade helper function
  const crossfade = async (fromAudio, fromGain, toAudio, toGain, direction) => {
    if (!audioContextRef.current || isTransitioning) return;

    setIsTransitioning(true);
    const now = audioContextRef.current.currentTime;
    const FADE_DURATION = 2.5;

    try {
      // Fade out current track
      fromGain.gain.setValueAtTime(fromGain.gain.value, now);
      fromGain.gain.exponentialRampToValueAtTime(0.01, now + FADE_DURATION);

      // Start and fade in new track
      toAudio.currentTime = 0;
      toGain.gain.setValueAtTime(0.01, now);

      await toAudio.play();
      toGain.gain.exponentialRampToValueAtTime(0.85, now + FADE_DURATION);

      // Update current audio state
      setCurrentAudio(direction === 'forward' ? 'top' : 'intro');

      // Pause faded-out track after transition completes
      setTimeout(() => {
        fromAudio.pause();
        setIsTransitioning(false);
      }, FADE_DURATION * 1000);
    } catch (error) {
      console.error('Crossfade failed:', error);
      setIsTransitioning(false);
    }
  };

  // Bidirectional transition logic based on current slide
  useEffect(() => {
    if (!enabled || isTransitioning) return;
    if (!introAudioRef.current || !topAudioRef.current) return;
    if (!introGainRef.current || !topGainRef.current) return;
    if (!introTrackId || !topTrackId) return;

    const isAtOrPastTopTrack = currentSlide >= topTrackSlideIndex;

    // Forward transition: intro → top track
    if (isAtOrPastTopTrack && currentAudio === 'intro') {
      crossfade(
        introAudioRef.current,
        introGainRef.current,
        topAudioRef.current,
        topGainRef.current,
        'forward'
      );
    }

    // Backward transition: top track → intro
    if (!isAtOrPastTopTrack && currentAudio === 'top') {
      crossfade(
        topAudioRef.current,
        topGainRef.current,
        introAudioRef.current,
        introGainRef.current,
        'backward'
      );
    }
  }, [currentSlide, currentAudio, topTrackSlideIndex, enabled, isTransitioning, introTrackId, topTrackId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current.currentTime = 0;
      }
      if (topAudioRef.current) {
        topAudioRef.current.pause();
        topAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Render hidden audio elements
  const audioElements = (
    <>
      {introTrackId && (
        <audio
          ref={introAudioRef}
          src={`${API_BASE_URL}/stream/${introTrackId}`}
          crossOrigin="anonymous"
          loop
          preload="auto"
          style={{ display: 'none' }}
        />
      )}
      {topTrackId && (
        <audio
          ref={topAudioRef}
          src={`${API_BASE_URL}/stream/${topTrackId}`}
          crossOrigin="anonymous"
          loop
          preload="auto"
          style={{ display: 'none' }}
        />
      )}
    </>
  );

  return {
    audioElements,
    autoplayBlocked,
    manualPlay,
    isPlaying
  };
}
