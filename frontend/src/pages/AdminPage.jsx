import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import PasswordPrompt from '../components/PasswordPrompt';
import { API_BASE_URL } from '../utils/constants';

const AdminPage = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth('admin');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [playCounts, setPlayCounts] = useState({});
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      checkAndMigrate();
    }
  }, [isAuthenticated]);

  const checkAndMigrate = async () => {
    try {
      setIsLoading(true);
      // Trigger migration
      const migrateResponse = await fetch(`${API_BASE_URL}/admin/migrate`, {
        method: 'POST',
      });
      const migrateData = await migrateResponse.json();

      if (migrateData.success) {
        setMigrationStatus(migrateData.message);
        // Load tracks after migration
        await fetchTracks();
      } else {
        setError(migrateData.message);
      }
    } catch (err) {
      console.error('Error during migration:', err);
      setError('Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      setIsLoading(true);

      // Fetch tracks and play counts in parallel
      const [tracksResponse, playCountsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/tracks`),
        fetch(`${API_BASE_URL}/admin/statistics/play-counts`),
      ]);

      const tracksData = await tracksResponse.json();
      const playCountsData = await playCountsResponse.json();

      if (tracksData.success) {
        setTracks(tracksData.tracks);
      } else {
        setError('Failed to load tracks');
      }

      if (playCountsData.success) {
        setPlayCounts(playCountsData.playCounts);
        // Calculate total plays
        const total = Object.values(playCountsData.playCounts).reduce((sum, count) => sum + count, 0);
        setTotalPlays(total);
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrackVisibility = async (filename, visibility) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tracks/${encodeURIComponent(filename)}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setTracks(tracks.map(track =>
          track.filename === filename
            ? { ...track, visibility }
            : track
        ));
      } else {
        alert(`Failed to update track: ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating track visibility:', err);
      alert('Failed to update track visibility');
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
      <div className="min-h-screen bg-sp-black flex items-center justify-center">
        <div className="text-sp-text text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordPrompt onSubmit={handlePasswordSubmit} error={authError} title="Admin Login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sp-black flex items-center justify-center">
        <div className="text-sp-text text-xl">
          {migrationStatus || 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sp-black flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  const visibilityStats = {
    public: tracks.filter(t => t.visibility === 'public').length,
    private: tracks.filter(t => t.visibility === 'private').length,
    disabled: tracks.filter(t => t.visibility === 'disabled').length,
  };

  return (
    <div className="min-h-screen bg-sp-black text-sp-text p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Jützlify Admin</h1>
          <p className="text-sp-text-secondary">Track visibility management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Public</div>
            <div className="text-3xl font-bold text-sp-green">{visibilityStats.public}</div>
          </div>
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Private</div>
            <div className="text-3xl font-bold text-blue-400">{visibilityStats.private}</div>
          </div>
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Disabled</div>
            <div className="text-3xl font-bold text-sp-text-muted">{visibilityStats.disabled}</div>
          </div>
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Total Plays</div>
            <div className="text-3xl font-bold text-sp-green">{totalPlays.toLocaleString()}</div>
          </div>
        </div>

        {/* Track List */}
        <div className="bg-sp-dark rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Tracks ({tracks.length})</h2>
            <button
              onClick={fetchTracks}
              disabled={isLoading}
              className="px-4 py-2 bg-sp-gray hover:bg-sp-light-gray rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Refresh play counts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="space-y-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-sp-gray p-4 rounded-lg hover:bg-sp-light-gray transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sp-text">{track.title || track.filename}</div>
                    <div className="text-sm text-sp-text-secondary">
                      {track.artist || 'Unknown Artist'}
                      {track.album && ` • ${track.album}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Play count badge */}
                    <div className="flex items-center gap-1 text-sp-text-secondary">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">
                        {playCounts[track.filename] || 0}
                      </span>
                    </div>
                    <select
                      value={track.visibility}
                      onChange={(e) => updateTrackVisibility(track.filename, e.target.value)}
                      className="bg-sp-black text-sp-text px-4 py-2 rounded-lg border border-sp-light-gray focus:outline-none focus:border-sp-green"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="disabled">Disabled</option>
                    </select>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        track.visibility === 'public'
                          ? 'bg-sp-green/20 text-sp-green'
                          : track.visibility === 'private'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-sp-text-muted/20 text-sp-text-muted'
                      }`}
                    >
                      {track.visibility}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {tracks.length === 0 && (
              <div className="text-center text-sp-text-secondary py-8">
                No tracks found. Add MP3 files to the backend/tracks/all/ directory.
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <a
            href="/"
            className="px-6 py-3 bg-sp-gray hover:bg-sp-light-gray rounded-lg transition-colors"
          >
            Go to Public Page
          </a>
          <a
            href="/private"
            className="px-6 py-3 bg-sp-gray hover:bg-sp-light-gray rounded-lg transition-colors"
          >
            Go to Private Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
