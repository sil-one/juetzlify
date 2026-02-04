import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import PasswordPrompt from '../components/PasswordPrompt';
import VisibilitySlider from '../components/VisibilitySlider';
import { FEATURED_SHOWS } from '../utils/featuredShows';
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [wrappedStatus, setWrappedStatus] = useState({ public: false, private: false });
  const [podcastAdsStatus, setPodcastAdsStatus] = useState({ public: true, private: true });
  const [bannerVersion, setBannerVersion] = useState(1);
  const [isBumping, setIsBumping] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('juetzlify-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkAndMigrate();
      fetchWrappedStatus();
      fetchPodcastAdsStatus();
      fetchBannerVersion();
    }
  }, [isAuthenticated]);

  const checkAndMigrate = async () => {
    try {
      setIsLoading(true);
      // Trigger migration
      const migrateResponse = await fetch(`${API_BASE_URL}/admin/migrate`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
        fetch(`${API_BASE_URL}/admin/tracks`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/admin/statistics/play-counts`, { headers: getAuthHeaders() }),
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
        headers: getAuthHeaders(),
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

  const fetchWrappedStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/wrapped/status`, { headers: getAuthHeaders() });
      const data = await response.json();

      if (data.success) {
        setWrappedStatus(data.wrappedEnabled);
      }
    } catch (err) {
      console.error('Error fetching wrapped status:', err);
    }
  };

  const toggleWrapped = async (type) => {
    try {
      const newValue = !wrappedStatus[type];
      const response = await fetch(`${API_BASE_URL}/admin/wrapped/enable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, enabled: newValue }),
      });

      const data = await response.json();

      if (data.success) {
        setWrappedStatus({ ...wrappedStatus, [type]: newValue });
      } else {
        alert(`Failed to toggle wrapped: ${data.error}`);
      }
    } catch (err) {
      console.error('Error toggling wrapped:', err);
      alert('Failed to toggle wrapped');
    }
  };

  const fetchPodcastAdsStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/podcast-ads/status`, { headers: getAuthHeaders() });
      const data = await response.json();

      if (data.success) {
        setPodcastAdsStatus(data.podcastAdsEnabled);
      }
    } catch (err) {
      console.error('Error fetching podcast ads status:', err);
    }
  };

  const togglePodcastAds = async (type) => {
    try {
      const newValue = !podcastAdsStatus[type];
      const response = await fetch(`${API_BASE_URL}/admin/podcast-ads/enable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, enabled: newValue }),
      });

      const data = await response.json();

      if (data.success) {
        setPodcastAdsStatus({ ...podcastAdsStatus, [type]: newValue });
      } else {
        alert(`Failed to toggle podcast ads: ${data.error}`);
      }
    } catch (err) {
      console.error('Error toggling podcast ads:', err);
      alert('Failed to toggle podcast ads');
    }
  };

  const fetchBannerVersion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/banner/version`, { headers: getAuthHeaders() });
      const data = await response.json();

      if (data.success) {
        setBannerVersion(data.version);
      }
    } catch (err) {
      console.error('Error fetching banner version:', err);
    }
  };

  const bumpBannerVersion = async () => {
    try {
      setIsBumping(true);
      const response = await fetch(`${API_BASE_URL}/banner/version`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setBannerVersion(data.version);
        alert(`Banner version updated to ${data.version}. All users will see the welcome banner again on their next visit.`);
      } else {
        alert(`Failed to bump banner version: ${data.message}`);
      }
    } catch (err) {
      console.error('Error bumping banner version:', err);
      alert('Failed to bump banner version');
    } finally {
      setIsBumping(false);
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

  const deleteTrack = async (filename, title) => {
    const confirmMessage = `Are you sure you want to delete "${title || filename}"?\n\nThis will remove:\n- The MP3 file\n- The visibility setting\n- The album art cache`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/tracks/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setTracks(tracks.filter(track => track.filename !== filename));
        alert(`Track "${title || filename}" deleted successfully!`);
      } else {
        alert(`Error deleting: ${data.error}`);
      }
    } catch (err) {
      console.error('Error deleting track:', err);
      alert('Error deleting track');
    }
  };

  const refreshMetadata = async () => {
    if (!window.confirm('Are you sure? This will clear all caches and reload all metadata from files.')) {
      return;
    }

    try {
      setIsRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/admin/refresh`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Metadata refreshed successfully!\n\nAlbum art cache cleared: ${data.albumArtCleared} images`);
        // Reload tracks to show fresh data
        await fetchTracks();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      alert('Error refreshing metadata');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    // Filter for MP3 files only
    const mp3Files = Array.from(files).filter(
      file => file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')
    );

    if (mp3Files.length === 0) {
      alert('Please select MP3 files only');
      return;
    }

    const formData = new FormData();
    mp3Files.forEach(file => {
      formData.append('tracks', file);
    });

    try {
      setIsUploading(true);
      setUploadProgress(`Uploading ${mp3Files.length} track(s)...`);

      const token = localStorage.getItem('juetzlify-token');
      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress(`Successfully uploaded ${mp3Files.length} track(s)`);
        // Refresh tracks list
        await fetchTracks();
        setTimeout(() => setUploadProgress(null), 3000);
      } else {
        alert(`Upload failed: ${data.error}`);
        setUploadProgress(null);
      }
    } catch (err) {
      console.error('Error uploading tracks:', err);
      alert('Failed to upload tracks');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    handleFileUpload(e.target.files);
    // Reset input
    e.target.value = '';
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Public</div>
            <div className="text-2xl md:text-3xl font-bold text-sp-green">{visibilityStats.public}</div>
          </div>
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Private</div>
            <div className="text-2xl md:text-3xl font-bold text-blue-400">{visibilityStats.private}</div>
          </div>
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Disabled</div>
            <div className="text-2xl md:text-3xl font-bold text-sp-text-muted">{visibilityStats.disabled}</div>
          </div>
          <div className="bg-sp-dark p-4 rounded-lg">
            <div className="text-sp-text-secondary text-sm mb-1">Total Plays</div>
            <div className="text-2xl md:text-3xl font-bold text-sp-green">{totalPlays.toLocaleString()}</div>
          </div>
        </div>

        {/* Activity Statistics Button */}
        <div className="mb-8">
          <a
            href="/admin/activity"
            className="block w-full sm:w-auto sm:inline-block px-6 py-4 bg-sp-green hover:bg-[#27ae60] text-sp-black font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-sp-green/50 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Activity Statistics</span>
            </div>
          </a>
        </div>

        {/* Wrapped Pages */}
        <div className="bg-sp-dark rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Wrapped Pages</h2>
          <p className="text-sp-text-secondary text-sm mb-6">
            Enable or disable Wrapped pages for public and private access. Wrapped pages show carnival statistics in a Spotify Wrapped-style presentation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Wrapped */}
            <div className="bg-sp-gray p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Public Wrapped</h3>
                  <p className="text-sm text-sp-text-secondary">Available at /wrapped</p>
                </div>
                <button
                  onClick={() => toggleWrapped('public')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    wrappedStatus.public ? 'bg-sp-green' : 'bg-sp-light-gray'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      wrappedStatus.public ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {wrappedStatus.public && (
                <a
                  href="/wrapped"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-sp-green hover:text-sp-green/80 transition-colors"
                >
                  <span>Open Wrapped Page</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Private Wrapped */}
            <div className="bg-sp-gray p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Private Wrapped</h3>
                  <p className="text-sm text-sp-text-secondary">Available at /wrapped-intern</p>
                </div>
                <button
                  onClick={() => toggleWrapped('private')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    wrappedStatus.private ? 'bg-blue-400' : 'bg-sp-light-gray'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      wrappedStatus.private ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {wrappedStatus.private && (
                <a
                  href="/wrapped-intern"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-400/80 transition-colors"
                >
                  <span>Open Private Wrapped</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Featured Shows Overlays */}
        <div className="bg-sp-dark rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured Show Overlays</h2>
          <p className="text-sp-text-secondary text-sm mb-6">
            Enable or disable featured show overlays for public and private pages. When enabled, shows display randomly on page load with a 1-hour cooldown between displays.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Public Featured Shows */}
            <div className="bg-sp-gray p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Public Shows</h3>
                  <p className="text-sm text-sp-text-secondary">Shown on public page</p>
                </div>
                <button
                  onClick={() => togglePodcastAds('public')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    podcastAdsStatus.public ? 'bg-sp-green' : 'bg-sp-light-gray'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      podcastAdsStatus.public ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Private Featured Shows */}
            <div className="bg-sp-gray p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Private Shows</h3>
                  <p className="text-sm text-sp-text-secondary">Shown on private page</p>
                </div>
                <button
                  onClick={() => togglePodcastAds('private')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    podcastAdsStatus.private ? 'bg-blue-400' : 'bg-sp-light-gray'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      podcastAdsStatus.private ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Featured Shows Gallery */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Shows</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {FEATURED_SHOWS.map((show) => (
                <div
                  key={show.filename}
                  className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  title={show.alt}
                >
                  <img
                    src={`/featured-shows/${show.filename}`}
                    alt={show.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="bg-sp-dark rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome Banner</h2>
          <p className="text-sp-text-secondary text-sm mb-6">
            Control the welcome banner shown on first visit. Bump the version to show the banner again to all users.
          </p>
          <div className="bg-sp-gray p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">Current Version</h3>
                  <span className="px-3 py-1 bg-sp-black rounded-full text-sp-green font-mono font-bold">
                    v{bannerVersion}
                  </span>
                </div>
                <p className="text-sm text-sp-text-secondary">
                  Incrementing the version will force all users to see the welcome banner again on their next visit to the public page.
                </p>
              </div>
              <button
                onClick={bumpBannerVersion}
                disabled={isBumping}
                className="px-6 py-3 bg-sp-green hover:bg-[#27ae60] text-sp-black font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-sp-green/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
              >
                {isBumping ? 'Bumping...' : 'Bump Version'}
              </button>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-sp-dark rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Upload Tracks</h2>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragging
                ? 'border-sp-green bg-sp-green/10'
                : 'border-sp-gray hover:border-sp-light-gray'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".mp3,audio/mpeg"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <svg
                className="w-16 h-16 text-sp-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p className="text-xl font-semibold text-sp-text mb-2">
                  {isDragging ? 'Drop files here' : 'Drag and drop MP3 files here'}
                </p>
                <p className="text-sp-text-secondary">
                  or click to browse (max 10 files, 100MB each)
                </p>
              </div>
            </label>
            {uploadProgress && (
              <div className="mt-4 px-4 py-2 bg-sp-green/20 text-sp-green rounded-lg inline-block">
                {uploadProgress}
              </div>
            )}
          </div>
          <p className="text-sm text-sp-text-muted mt-3">
            Uploaded tracks will be set to "disabled" visibility by default. Change visibility below to make them accessible.
          </p>
        </div>

        {/* Track List */}
        <div className="bg-sp-dark rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">Tracks ({tracks.length})</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchTracks}
                disabled={isLoading}
                className="px-4 py-2 bg-sp-gray hover:bg-sp-light-gray rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                title="Refresh play counts"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={refreshMetadata}
                disabled={isRefreshing}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                title="Clear all caches and reload metadata from files"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isRefreshing ? 'Loading...' : 'Reload metadata'}
              </button>
            </div>
          </div>

          {/* Slider Legend */}
          <div className="mb-4 flex items-center gap-4 text-xs text-sp-text-secondary">
            <span className="font-medium">Visibility:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sp-text-muted" />
              <span>Disabled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sp-green" />
              <span>Public</span>
            </div>
          </div>

          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-sp-gray p-4 rounded-lg hover:bg-sp-light-gray transition-colors"
              >
                {/* Mobile layout (stacked) and Desktop layout */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sp-text truncate">{track.title || track.filename}</div>
                    <div className="text-sm text-sp-text-secondary truncate">
                      {track.artist || 'Unknown Artist'}
                      {track.album && ` • ${track.album}`}
                    </div>
                  </div>

                  {/* Controls Container - Responsive */}
                  <div className="flex flex-col sm:flex-row lg:flex-row sm:items-center lg:items-center gap-3 w-full lg:w-auto">
                    {/* Play count badge */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-sp-black rounded-lg">
                      <svg className="w-4 h-4 text-sp-text-secondary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sp-text-secondary font-medium">
                        {playCounts[track.filename] || 0}
                      </span>
                    </div>

                    {/* Visibility Slider */}
                    <div className="flex-1 lg:w-48">
                      <VisibilitySlider
                        value={track.visibility}
                        onChange={(visibility) => updateTrackVisibility(track.filename, visibility)}
                      />
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTrack(track.filename, track.title)}
                      className="p-2 text-sp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete track"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
