# Jützlify Wrapped - Implementation Plan

This document outlines the implementation plan for the "Jützlify Wrapped" feature - a Spotify Wrapped-style statistics presentation for Carnival 2026.

## Overview

After carnival (February 11-17, 2026), the admin can enable public and/or private "wrapped" pages that showcase carnival statistics in an engaging, slide-through format.

**Carnival Dates:**
- **Wednesday, Feb 11**: Yytrummlä-Mittwuch
- **Thursday, Feb 12**: Schmutzigä Donnstig
- **Friday, Feb 13**: Fritig
- **Saturday, Feb 14**: Samschtig
- **Sunday, Feb 15**: Sunntig
- **Monday, Feb 16**: Gidelmäntig
- **Tuesday, Feb 17**: Üstrummlä-Zischtig
- **Wednesday, Feb 18**: Admin enables wrapped pages

## Two Wrapped Versions

### 1. Public Wrapped (`/wrapped`)
- Shows statistics for **public tracks only**
- Accessible to everyone (no password)
- Enabled via admin panel toggle

### 2. Private Wrapped (`/wrapped-intern`)
- Shows statistics for **all enabled tracks** (public + private)
- Password protected (uses private password)
- The "full picture" for Jützli insiders
- Enabled via admin panel toggle

## Phase 4: Wrapped Pages Implementation

### 4.1 Backend API Endpoints

Create new public-facing API endpoints in `backend/src/routes/wrapped.js`:

```javascript
/**
 * GET /api/wrapped/public
 * Get carnival statistics (public tracks only)
 * Returns 404 if wrapped is not enabled
 */
router.get('/public', async (req, res) => {
  const enabled = await isWrappedEnabled('public');
  if (!enabled) {
    return res.status(404).json({ error: 'Wrapped page not available' });
  }

  const statistics = await getCarnivalStatistics(false); // Public only
  res.json({ success: true, ...statistics });
});

/**
 * GET /api/wrapped/private
 * Get carnival statistics (all enabled tracks)
 * Requires authentication
 * Returns 404 if wrapped is not enabled
 */
router.get('/private', async (req, res) => {
  const enabled = await isWrappedEnabled('private');
  if (!enabled) {
    return res.status(404).json({ error: 'Wrapped page not available' });
  }

  // Add authentication middleware
  const { password } = req.headers;
  if (!authenticatePrivate(password)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const statistics = await getCarnivalStatistics(true); // All tracks
  res.json({ success: true, ...statistics });
});
```

**Register route in `server.js`:**
```javascript
import wrappedRouter from './routes/wrapped.js';
app.use('/api/wrapped', wrappedRouter);
```

### 4.2 Frontend Components

#### 4.2.1 WrappedPage Component (`frontend/src/pages/WrappedPage.jsx`)

**Structure:**
```jsx
const WrappedPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wrapped/public`);
      if (response.status === 404) {
        setError('Wrapped page not available yet');
        return;
      }
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="wrapped-container">
      {/* Slide components */}
      {currentSlide === 0 && <IntroSlide />}
      {currentSlide === 1 && <TotalPlaysSlide stats={statistics} />}
      {currentSlide === 2 && <TotalHoursSlide stats={statistics} />}
      {currentSlide === 3 && <TopTrackSlide track={statistics.topTracks[0]} />}
      {/* ... more slides ... */}

      {/* Navigation */}
      <SlideNavigation
        current={currentSlide}
        total={TOTAL_SLIDES}
        onNext={nextSlide}
        onPrev={prevSlide}
      />
    </div>
  );
};
```

#### 4.2.2 Slide Components

Create individual slide components in `frontend/src/components/wrapped/`:

**IntroSlide.jsx:**
```jsx
const IntroSlide = () => (
  <div className="slide-container">
    <h1 className="wrapped-title">Jützlify Wrapped 2026</h1>
    <div className="wrapped-divider" />
    <p className="wrapped-subtitle">Fasnacht Edition</p>
    <div className="swipe-hint">Wisch oder drück → zum witergah</div>
  </div>
);
```

**TotalPlaysSlide.jsx:**
```jsx
const TotalPlaysSlide = ({ stats }) => (
  <div className="slide-container">
    <p className="wrapped-intro-text">Während dr Fasnacht 2026</p>

    <CountUp
      end={stats.uniqueTracks}
      duration={2}
      className="wrapped-big-number"
    />
    <p className="wrapped-label">Lieder</p>

    <p className="wrapped-mid-text">wurden</p>

    <CountUp
      end={stats.totalPlays}
      duration={2}
      className="wrapped-big-number"
    />
    <p className="wrapped-label">mal</p>

    <p className="wrapped-outro-text">abgspielt!</p>
  </div>
);
```

**TopTrackSlide.jsx:**
```jsx
const TopTrackSlide = ({ track }) => (
  <div className="slide-container">
    <div className="album-art-large">
      <img src={track.albumArt} alt={track.title} />
    </div>

    <p className="wrapped-intro-text">Das beliebteste Lied war:</p>

    <h2 className="wrapped-track-title">"{track.title}"</h2>
    <p className="wrapped-track-artist">{track.artist}</p>

    <div className="wrapped-play-count">
      <CountUp end={track.count} duration={2} />
      <span> plays</span>
    </div>
  </div>
);
```

**DailyBreakdownSlide.jsx:**
```jsx
const DailyBreakdownSlide = ({ playsByDay }) => (
  <div className="slide-container">
    <h2 className="wrapped-section-title">Jede Tag vo dr Fasnacht</h2>

    <div className="bar-chart">
      {playsByDay.map((day) => (
        <div key={day.date} className="bar-item">
          <div className="bar-label">{day.name}:</div>
          <div className="bar-container">
            <div
              className="bar-fill"
              style={{ width: `${(day.plays / maxPlays) * 100}%` }}
            />
            <span className="bar-value">{day.plays}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

#### 4.2.3 Private Wrapped Component

Create `PrivateWrappedPage.jsx` - similar to WrappedPage but:
- Uses `useAuth('private')` hook
- Shows PasswordPrompt if not authenticated
- Fetches from `/api/wrapped/private`
- Displays "Jützli Intern - Vollständigi Statistik" badge

```jsx
const PrivateWrappedPage = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth('private');
  const [authError, setAuthError] = useState(null);

  if (authLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <PasswordPrompt
        onSubmit={async (password) => {
          const result = await login(password);
          if (!result.success) {
            setAuthError(result.error);
          }
        }}
        error={authError}
        title="Jützli Intern - Wrapped"
      />
    );
  }

  // Rest similar to WrappedPage but with /api/wrapped/private
  return <WrappedSlides endpoint="/api/wrapped/private" isPrivate />;
};
```

### 4.3 Styling

Create `frontend/src/styles/wrapped.css`:

```css
.wrapped-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.slide-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.wrapped-title {
  font-size: 4rem;
  font-weight: bold;
  color: #2ECC71;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(46, 204, 113, 0.3);
}

.wrapped-divider {
  width: 100px;
  height: 3px;
  background: #2ECC71;
  margin: 2rem auto;
}

.wrapped-big-number {
  font-size: 6rem;
  font-weight: bold;
  color: #2ECC71;
  line-height: 1;
  text-shadow: 0 0 30px rgba(46, 204, 113, 0.5);
}

.wrapped-label {
  font-size: 2rem;
  color: #B3B3B3;
  margin-bottom: 2rem;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-label {
  min-width: 200px;
  text-align: right;
  color: #B3B3B3;
  font-size: 0.9rem;
}

.bar-container {
  flex: 1;
  height: 40px;
  background: #282828;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2ECC71 0%, #27ae60 100%);
  border-radius: 20px;
  transition: width 1s ease-out;
  box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
}

.bar-value {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .wrapped-title {
    font-size: 2.5rem;
  }

  .wrapped-big-number {
    font-size: 4rem;
  }

  .bar-label {
    min-width: 120px;
    font-size: 0.8rem;
  }
}
```

### 4.4 Add Routes

Update `frontend/src/App.jsx`:

```jsx
import WrappedPage from './pages/WrappedPage';
import PrivateWrappedPage from './pages/PrivateWrappedPage';

<Routes>
  <Route path="/wrapped" element={<WrappedPage />} />
  <Route path="/wrapped-intern" element={<PrivateWrappedPage />} />
  <Route path="/admin" element={<AdminPage />} />
  {/* ... other routes ... */}
</Routes>
```

### 4.5 Admin Panel Controls

Add wrapped toggle controls to `AdminPage.jsx`:

```jsx
// State
const [wrappedStatus, setWrappedStatus] = useState({ public: false, private: false });

// Fetch status
useEffect(() => {
  if (isAuthenticated) {
    fetchWrappedStatus();
  }
}, [isAuthenticated]);

const fetchWrappedStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/wrapped/status`);
  const data = await response.json();
  if (data.success) {
    setWrappedStatus(data.wrappedEnabled);
  }
};

const toggleWrapped = async (type) => {
  const newValue = !wrappedStatus[type];
  const response = await fetch(`${API_BASE_URL}/admin/wrapped/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, enabled: newValue }),
  });

  const data = await response.json();
  if (data.success) {
    setWrappedStatus({ ...wrappedStatus, [type]: newValue });
  }
};

// UI Section (add after stats cards)
<div className="bg-sp-dark rounded-lg p-6 mb-8">
  <h2 className="text-2xl font-bold mb-4">Wrapped Pages</h2>

  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold">Public Wrapped</div>
        <div className="text-sm text-sp-text-secondary">
          Shows statistics for public tracks only
        </div>
      </div>
      <button
        onClick={() => toggleWrapped('public')}
        className={`px-6 py-2 rounded-lg transition-colors ${
          wrappedStatus.public
            ? 'bg-sp-green hover:bg-sp-green-bright text-black'
            : 'bg-sp-gray hover:bg-sp-light-gray text-sp-text'
        }`}
      >
        {wrappedStatus.public ? 'Enabled' : 'Disabled'}
      </button>
    </div>

    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold">Private Wrapped</div>
        <div className="text-sm text-sp-text-secondary">
          Shows statistics for all enabled tracks (requires password)
        </div>
      </div>
      <button
        onClick={() => toggleWrapped('private')}
        className={`px-6 py-2 rounded-lg transition-colors ${
          wrappedStatus.private
            ? 'bg-sp-green hover:bg-sp-green-bright text-black'
            : 'bg-sp-gray hover:bg-sp-light-gray text-sp-text'
        }`}
      >
        {wrappedStatus.private ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  </div>

  {wrappedStatus.public && (
    <div className="mt-4 p-3 bg-sp-green/20 border border-sp-green rounded-lg">
      <span className="text-sp-green font-medium">Public wrapped is live at: </span>
      <a href="/wrapped" target="_blank" className="text-sp-green underline">
        /wrapped
      </a>
    </div>
  )}

  {wrappedStatus.private && (
    <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
      <span className="text-blue-400 font-medium">Private wrapped is live at: </span>
      <a href="/wrapped-intern" target="_blank" className="text-blue-400 underline">
        /wrapped-intern
      </a>
    </div>
  )}
</div>
```

## Phase 5: Polish & Testing

### 5.1 Animations & Transitions

Install animation libraries:
```bash
cd frontend
npm install react-countup react-swipeable
```

Use `react-countup` for number animations:
```jsx
import CountUp from 'react-countup';

<CountUp
  end={statistics.totalPlays}
  duration={2}
  separator=","
  className="wrapped-big-number"
/>
```

Use `react-swipeable` for touch gestures:
```jsx
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: nextSlide,
  onSwipedRight: prevSlide,
  preventDefaultTouchmoveEvent: true,
  trackMouse: true,
});

<div {...handlers} className="wrapped-container">
  {/* slides */}
</div>
```

### 5.2 Data Visualization

Install charting library:
```bash
cd frontend
npm install recharts
```

Use for daily breakdown chart:
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={playsByDay}>
    <XAxis dataKey="name" stroke="#B3B3B3" />
    <YAxis stroke="#B3B3B3" />
    <Tooltip
      contentStyle={{ background: '#282828', border: 'none' }}
      labelStyle={{ color: '#2ECC71' }}
    />
    <Bar dataKey="plays" fill="#2ECC71" radius={[10, 10, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### 5.3 Testing Checklist

- [ ] Test wrapped page with mock data before carnival
- [ ] Test public wrapped page accessibility (no password required)
- [ ] Test private wrapped page authentication
- [ ] Test wrapped enable/disable toggles in admin panel
- [ ] Test 404 response when wrapped is disabled
- [ ] Test keyboard navigation (arrow keys)
- [ ] Test touch gestures on mobile
- [ ] Test animations and number counting
- [ ] Test chart rendering with carnival data
- [ ] Test responsive design on different screen sizes
- [ ] Verify carnival day names display correctly
- [ ] Test edge cases (no plays, single play, etc.)

### 5.4 Launch Timeline

1. **During Carnival** (Feb 11-17): Play tracking runs automatically
2. **Feb 18**: Review statistics in admin panel
3. **Feb 18**: Enable public wrapped page via admin toggle
4. **Feb 18**: Enable private wrapped page via admin toggle
5. **Post-Launch**: Monitor and fix any issues

## Bonus Features (Optional)

### Share Functionality
Add "Share your Jützlify Wrapped" button that:
- Generates a shareable image
- Uses `html2canvas` to screenshot the slide
- Allows download or share via Web Share API

```jsx
import html2canvas from 'html2canvas';

const shareSlide = async () => {
  const element = document.getElementById('current-slide');
  const canvas = await html2canvas(element);
  const blob = await canvas.toBlob();

  if (navigator.share) {
    await navigator.share({
      title: 'Jützlify Wrapped 2026',
      files: [new File([blob], 'wrapped.png', { type: 'image/png' })],
    });
  }
};
```

### Export Statistics
Add CSV/JSON export in admin panel:

```jsx
const exportStatistics = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/statistics/carnival`);
  const data = await response.json();

  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'carnival-2026-statistics.csv';
  a.click();
};
```

### Year-over-Year Comparison
For future carnivals, compare statistics:
```jsx
<div className="comparison-slide">
  <h2>Compared to Carnival 2025</h2>
  <div className="stat-comparison">
    <div className="stat">
      <span className="label">Total Plays</span>
      <span className="value">1,247</span>
      <span className="change positive">+23%</span>
    </div>
  </div>
</div>
```

## File Structure

```
juetzlify/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── wrapped.js              (NEW - public wrapped endpoints)
│       └── services/
│           └── playStatisticsService.js (EXISTING - already has wrapped functions)
│
└── frontend/
    └── src/
        ├── components/
        │   └── wrapped/                 (NEW)
        │       ├── IntroSlide.jsx
        │       ├── TotalPlaysSlide.jsx
        │       ├── TotalHoursSlide.jsx
        │       ├── TopTrackSlide.jsx
        │       ├── TopFiveSlide.jsx
        │       ├── DailyBreakdownSlide.jsx
        │       ├── BiggestDaySlide.jsx
        │       ├── FunFactsSlide.jsx
        │       ├── ThankYouSlide.jsx
        │       └── SlideNavigation.jsx
        ├── pages/
        │   ├── WrappedPage.jsx          (NEW - public wrapped)
        │   └── PrivateWrappedPage.jsx   (NEW - private wrapped)
        └── styles/
            └── wrapped.css              (NEW)
```

## Implementation Estimate

- **Backend API endpoints**: 30 minutes
- **Individual slide components**: 2-3 hours
- **WrappedPage main component**: 1 hour
- **PrivateWrappedPage variant**: 30 minutes
- **Styling and animations**: 1-2 hours
- **Admin panel controls**: 30 minutes
- **Testing and polish**: 1 hour

**Total**: 6-8 hours of implementation

## Notes

- All backend functionality is already implemented (playStatisticsService.js)
- Play tracking is already working (after 15 seconds)
- Admin can see play counts in admin panel already
- Only need to build the wrapped UI and enable/disable controls
- Statistics are already being collected for carnival dates
- Can test with mock data before carnival starts
