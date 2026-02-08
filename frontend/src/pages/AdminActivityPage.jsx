import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import PasswordPrompt from '../components/PasswordPrompt';
import RecentPlaysList from '../components/admin-activity/RecentPlaysList';
import HottestTracksChart from '../components/admin-activity/HottestTracksChart';
import PlaysTimelineChart from '../components/admin-activity/PlaysTimelineChart';
import { API_BASE_URL } from '../utils/constants';

const TIME_WINDOWS = [1, 4, 12, 24, 72, 168]; // hours: 1h, 4h, 12h, 24h, 3d, 7d

function AdminActivityPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth('admin');
  const [recentPlays, setRecentPlays] = useState([]);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(24);
  const [hottestData, setHottestData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('juetzlify-token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const headers = getAuthHeaders();

      // Parallel fetches
      const [playsRes, hottestRes, timelineRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/statistics/recent-plays?limit=50`, { headers }),
        fetch(`${API_BASE_URL}/admin/statistics/hottest?hours=${selectedTimeWindow}`, { headers }),
        fetch(`${API_BASE_URL}/admin/statistics/timeline?hours=${selectedTimeWindow}`, { headers }),
      ]);

      const [playsData, hottestData, timelineData] = await Promise.all([
        playsRes.json(),
        hottestRes.json(),
        timelineRes.json(),
      ]);

      if (playsData.success) {
        setRecentPlays(playsData.plays);
      } else {
        console.error('Failed to fetch recent plays:', playsData.error);
      }

      if (hottestData.success) {
        setHottestData(hottestData.tracks);
      } else {
        console.error('Failed to fetch hottest tracks:', hottestData.error);
      }

      if (timelineData.success) {
        setTimelineData(timelineData.timeline);
      } else {
        console.error('Failed to fetch timeline:', timelineData.error);
      }
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when time window changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedTimeWindow]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, selectedTimeWindow]);

  // Loading and authentication checks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-sp-black flex items-center justify-center">
        <div className="text-sp-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordPrompt type="admin" />;
  }

  return (
    <div className="min-h-screen bg-sp-black">
      {/* Header */}
      <div className="bg-sp-dark border-b border-sp-gray sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="text-sp-text-secondary hover:text-sp-green transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </a>
              <h1 className="text-2xl font-bold text-sp-text">Activity Statistics</h1>
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-4 py-2 bg-sp-green hover:bg-[#27ae60] text-sp-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Time Period Tabs */}
        <div className="mb-6 flex gap-2 bg-sp-dark rounded-lg p-2">
          {TIME_WINDOWS.map((hours) => {
            // Format label: hours for <24h, days for >=24h
            const label = hours >= 24
              ? `${hours / 24}d`
              : `${hours}h`;

            return (
              <button
                key={hours}
                onClick={() => setSelectedTimeWindow(hours)}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  selectedTimeWindow === hours
                    ? 'bg-sp-green text-sp-black'
                    : 'text-sp-text-secondary hover:text-sp-text hover:bg-sp-gray'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        {isLoading && !recentPlays.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sp-text-secondary">Loading activity data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Recent Plays (Sticky on desktop) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <RecentPlaysList plays={recentPlays} />
            </div>

            {/* Right Column: Charts */}
            <div className="space-y-6">
              <HottestTracksChart data={hottestData} timeWindow={selectedTimeWindow} />
              <PlaysTimelineChart data={timelineData} hours={selectedTimeWindow} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminActivityPage;
