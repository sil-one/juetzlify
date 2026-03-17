import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import PublicPage from './pages/PublicPage';
import PrivatePage from './pages/PrivatePage';
import AdminPage from './pages/AdminPage';
import AdminActivityPage from './pages/AdminActivityPage';
import WrappedPage from './pages/WrappedPage';
import PrivateWrappedPage from './pages/PrivateWrappedPage';
import SunsetOverlay from './components/SunsetOverlay';
import { API_BASE_URL } from './utils/constants';

const SUNSET_TIMESTAMP = new Date('2026-03-14T00:00:00+01:00').getTime();

function MainLayout() {
  const [showSunsetOverlay, setShowSunsetOverlay] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkSunset = async () => {
      if (Date.now() < SUNSET_TIMESTAMP) return;
      try {
        const response = await fetch(`${API_BASE_URL}/settings/sunset-mode`);
        const data = await response.json();
        if (data.success && data.enabled) {
          setShowSunsetOverlay(true);
        }
      } catch (err) {
        console.error('Error checking sunset mode:', err);
      }
    };
    checkSunset();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/private" element={<PrivatePage />} />
      </Routes>
      {showSunsetOverlay && location.pathname !== '/private' && (
        <SunsetOverlay onDismiss={() => setShowSunsetOverlay(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes without header */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/activity" element={<AdminActivityPage />} />
        <Route path="/wrapped" element={<WrappedPage />} />
        <Route path="/wrapped-intern" element={<PrivateWrappedPage />} />

        {/* Regular routes with header */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
