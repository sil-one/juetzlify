import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../utils/constants';
import useWrappedAudio from '../hooks/useWrappedAudio.jsx';
import PasswordPrompt from '../components/PasswordPrompt';
import '../styles/wrapped.css';

// Import all slide components
import IntroSlide from '../components/wrapped/IntroSlide';
import TotalPlaysSlide from '../components/wrapped/TotalPlaysSlide';
import TotalHoursSlide from '../components/wrapped/TotalHoursSlide';
import FakeBiarSlide from '../components/wrapped/FakeBiarSlide';
import TopTrackSlide from '../components/wrapped/TopTrackSlide';
import FakeChatzaSlide from '../components/wrapped/FakeChatzaSlide';
import TopFiveSlide from '../components/wrapped/TopFiveSlide';
import DailyBreakdownSlide from '../components/wrapped/DailyBreakdownSlide';
import FakeSchwangerSlide from '../components/wrapped/FakeSchwangerSlide';
import BiggestDaySlide from '../components/wrapped/BiggestDaySlide';
import TimeOfDaySlide from '../components/wrapped/TimeOfDaySlide';
import FakeZungaSlide from '../components/wrapped/FakeZungaSlide';
import FirstLastSlide from '../components/wrapped/FirstLastSlide';
import FakeFasnachtsfleSlide from '../components/wrapped/FakeFasnachtsfleSlide';
import FakeBeizSlide from '../components/wrapped/FakeBeizSlide';
import ThankYouSlide from '../components/wrapped/ThankYouSlide';
import SlideNavigation from '../components/wrapped/SlideNavigation';

const TOTAL_SLIDES = 16;
const TOP_TRACK_SLIDE_INDEX = 4;

const PrivateWrappedPage = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth('private');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Initialize wrapped audio with background music
  const { audioElements, autoplayBlocked, manualPlay } = useWrappedAudio({
    statistics,
    currentSlide,
    topTrackSlideIndex: TOP_TRACK_SLIDE_INDEX,
    trackType: 'private',
    enabled: !loading && !error && statistics && isAuthenticated
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatistics();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('juetzlify-token');

      if (!token) {
        setError('Kei Token gfundä');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/wrapped/private`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('Wrapped isch no nöd verfüegbar');
        } else if (response.status === 401) {
          setError('Token ungültig');
        } else {
          setError(data.error || 'Fähler bim Lade');
        }
        setLoading(false);
        return;
      }

      setStatistics(data.statistics);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching private wrapped statistics:', err);
      setError('Fähler bim Lade');
      setLoading(false);
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

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const renderSlide = () => {
    if (!statistics) return null;

    switch (currentSlide) {
      case 0:
        return <IntroSlide />;
      case 1:
        return (
          <TotalPlaysSlide
            uniqueTracks={statistics.uniqueTracks}
            totalPlays={statistics.totalPlays}
          />
        );
      case 2:
        return <TotalHoursSlide totalPlays={statistics.allTimeTotalPlays} />;
      case 3:
        return <FakeBiarSlide />;
      case 4:
        return <TopTrackSlide track={statistics.topTracks[0]} />;
      case 5:
        return <FakeChatzaSlide />;
      case 6:
        return <TopFiveSlide topTracks={statistics.topTracks} />;
      case 7:
        return <DailyBreakdownSlide playsByDay={statistics.playsByDay} />;
      case 8:
        return <FakeSchwangerSlide />;
      case 9:
        return <BiggestDaySlide biggestDay={statistics.biggestDay} />;
      case 10:
        return (
          <TimeOfDaySlide
            mostActiveTimeOfDay={statistics.mostActiveTimeOfDay}
            timeOfDayStats={statistics.timeOfDayStats}
          />
        );
      case 11:
        return <FakeZungaSlide />;
      case 12:
        return (
          <FirstLastSlide
            firstTrack={statistics.firstTrack}
            lastTrack={statistics.lastTrack}
          />
        );
      case 13:
        return <FakeFasnachtsfleSlide />;
      case 14:
        return <FakeBeizSlide />;
      case 15:
        return <ThankYouSlide />;
      default:
        return <IntroSlide />;
    }
  };

  if (authLoading) {
    return (
      <div className="wrapped-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="wrapped-label">Lädt...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordPrompt onSubmit={handlePasswordSubmit} error={authError} />;
  }

  if (loading) {
    return (
      <div className="wrapped-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="wrapped-label">Lädt Statistike...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrapped-container">
        <div className="error-container">
          <div className="error-title">🎭</div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapped-container" {...swipeHandlers}>
      <div className="private-badge">Jützli Intern</div>

      <AnimatePresence mode="wait">
        <div key={currentSlide}>{renderSlide()}</div>
      </AnimatePresence>

      {/* Hidden audio elements for background music */}
      {audioElements}

      {/* Play button if autoplay blocked */}
      {autoplayBlocked && (
        <button
          onClick={manualPlay}
          className="wrapped-play-button"
          aria-label="Müsig aktiviärä"
        >
          ▶️ Müsig aktiviärä
        </button>
      )}

      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={TOTAL_SLIDES}
        onPrev={handlePrev}
        onNext={handleNext}
        onDotClick={handleDotClick}
      />
    </div>
  );
};

export default PrivateWrappedPage;
