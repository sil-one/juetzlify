# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jützlify is a mobile-first music streaming SPA with a three-tier track library (public, password-protected private tracks, and admin-managed visibility). Album art is extracted from MP3 ID3 tags.

**Stack**: React 19 + Vite frontend, Express + Node.js backend, Tailwind CSS styling

**Features**:
- Public music streaming
- Password-protected private library
- Admin panel for track visibility management
- Backend-validated authentication
- **Full PWA support** - Install to home screen, works offline
- **Offline downloads** - Explicit track downloads for offline playback
- **PM2 cluster mode** - Horizontal scaling across CPU cores
- **Atomic file writes** - Data integrity in multi-worker environment
- **Offline play sync** - Plays recorded offline sync with original timestamps

## Commands

### Installation
```bash
npm run install:all  # Installs all dependencies (root, frontend, backend)
```

### Development
```bash
# Run in separate terminals
npm run dev:backend   # Backend on port 3000 (single instance)
npm run dev:frontend  # Frontend on port 5173 (proxies API to localhost:3000)
```

### Production (PM2 Cluster)
```bash
# Start cluster (uses all CPU cores)
pm2 start ecosystem.config.cjs

# Graceful reload (zero downtime)
pm2 reload juetzlify-backend

# Monitor
pm2 monit
pm2 logs juetzlify-backend

# Stop
pm2 stop juetzlify-backend
pm2 delete juetzlify-backend
```

### Build
```bash
npm run build:frontend  # Produces frontend/dist/
./scripts/build.sh      # Full build script
```

### Lint
```bash
cd frontend && npm run lint
```

### Docker
```bash
docker build -f docker/Dockerfile -t juetzlify .
docker-compose -f docker/docker-compose.yml up --build
```

## Architecture

**Monorepo with npm workspaces** (`frontend/` and `backend/`)

### Frontend (`frontend/src/`)
- **Components**: `components/` - AudioPlayer, TrackList, AlbumArt, Header, PasswordPrompt, PrivateButton, DownloadButton, OfflineIndicator
- **Pages**: `pages/` - PublicPage (`/`), PrivatePage (`/private`), AdminPage (`/admin`)
- **Hooks**: `hooks/` - `useAudioPlayer` (playback state/controls), `useAuth` (backend-validated auth), `useDownloads` (download management), `useOnlineStatus` (offline detection)
- **Services**: `services/` - `downloadService.js` (IndexedDB operations), `offlinePlayService.js` (offline play queue)
- **Contexts**: `contexts/` - `DownloadsContext` (global download state)
- **PWA**: `public/audio-cache-sw.js` (Service Worker), `public/manifest.json` (PWA manifest)
- **Constants**: `utils/constants.js` - colors, API base URL (auto-switches dev/prod)

### Backend (`backend/src/`)
- **Entry**: `server.js` - Express app with CORS, logging, static serving (PM2 cluster-ready)
- **Routes**:
  - `routes/auth.js` - Authentication endpoints for private and admin access
  - `routes/admin.js` - Admin endpoints for track visibility management and migration
  - `routes/tracks.js` - Track listing with visibility filtering, cache refresh, play recording (supports offline timestamp)
  - `routes/stream.js` - HTTP range-request streaming
- **Services**:
  - `services/trackService.js` - Track discovery/caching with visibility filtering
  - `services/visibilityService.js` - Track visibility metadata management and migration (atomic writes)
  - `services/playStatisticsService.js` - Play tracking with atomic writes, lockfile coordination, offline sync support
  - `services/metadataService.js` - ID3 extraction via music-metadata
  - `services/albumArtService.js` - Sharp image caching
- **Config**: `config/config.js` - reads from .env (PORT, TRACKS_PATH, CACHE_PATH, DATA_PATH, password hashes)
- **PM2**: `ecosystem.config.cjs` - Cluster mode configuration (max instances, graceful reload)

### Data Flow
1. Backend scans `backend/tracks/all/` for MP3s (auto-migrates from old public/private folders on first admin access)
2. Track visibility stored in `backend/data/track-visibility.json` (public/private/disabled)
3. Metadata extracted via music-metadata, album art cached via Sharp
4. Frontend fetches filtered track list from `/api/tracks?type=public|private`
5. Audio streams via `/api/stream/:trackId` with HTTP range support
6. Admin can manage track visibility via `/api/admin/tracks/:filename/visibility`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/private` | POST | Authenticate for private library access |
| `/api/auth/admin` | POST | Authenticate for admin access |
| `/api/tracks?type=public\|private\|admin` | GET | Fetch tracks list (filtered by visibility) |
| `/api/tracks/:trackId/play` | POST | Record play (accepts optional `timestamp` for offline sync) |
| `/api/stream/:trackId` | GET | Stream MP3 (supports Range header) |
| `/api/album-art/:trackId.jpg` | GET | Serve cached album art |
| `/api/tracks/refresh` | POST | Clear cache and reload metadata |
| `/api/admin/migrate` | POST | Migrate tracks from public/private to all/ folder |
| `/api/admin/tracks` | GET | Get all tracks with visibility info (admin only) |
| `/api/admin/tracks/:filename/visibility` | PUT | Update track visibility (public/private/disabled) |

## Styling

Spotify-inspired dark theme with custom Tailwind colors defined in `tailwind.config.js`:
- `sp-black`: #121212 (main background)
- `sp-dark`: #181818 (cards, surfaces)
- `sp-gray`: #282828 (elevated elements)
- `sp-light-gray`: #404040 (hover states)
- `sp-green`: #2ECC71 (accent color, matches logo)
- `sp-text`: #FFFFFF (primary text)
- `sp-text-secondary`: #B3B3B3 (secondary text)
- `sp-text-muted`: #727272 (muted text)

Color constants also in `frontend/src/utils/constants.js` for JS usage.

## Authentication

Both private library and admin panel use backend-validated authentication with SHA-256 password hashing.

**Setup**:
1. Generate password hashes:
   ```bash
   echo -n "your-password" | shasum -a 256
   ```

2. Set environment variables in `backend/.env`:
   ```
   PRIVATE_PASSWORD_HASH=your-private-hash-here
   ADMIN_PASSWORD_HASH=your-admin-hash-here
   ```

**Development Passwords** (in backend/.env):
- Private library: `private` (hash: 04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb)
- Admin panel: `admin` (hash: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918)

## Admin Panel

Access at `/admin` route (no visible navigation - direct URL access only).

**Features**:
- Auto-migration from old `public/`+`private/` folders to `all/` folder structure
- Track visibility management (public/private/disabled)
- Real-time statistics dashboard
- No admin button in UI - hidden route for security

**Track Visibility**:
- **Public**: Available on public page (accessible to all)
- **Private**: Only available on private page (password required)
- **Disabled**: Hidden from both public and private pages

**Adding New Tracks**:
- New MP3 files added to `backend/tracks/all/` default to **disabled** visibility
- Use the admin panel to set them to public or private after adding them

## Production Architecture

### PM2 Cluster Mode

The backend runs in **cluster mode** via PM2 for horizontal scaling:

**Configuration** (`ecosystem.config.cjs`):
```javascript
module.exports = {
  apps: [{
    name: 'juetzlify-backend',
    script: './src/server.js',
    instances: 'max',      // Use all CPU cores
    exec_mode: 'cluster',  // Cluster mode for load balancing
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Why Cluster Mode**:
- **Scalability**: Handles hundreds of simultaneous users
- **Zero-downtime**: Graceful restarts with rolling updates
- **CPU utilization**: Distributes load across all cores
- **Fault tolerance**: Auto-restarts failed processes

**Commands**:
```bash
pm2 start ecosystem.config.cjs    # Start cluster
pm2 reload juetzlify-backend      # Graceful reload (zero downtime)
pm2 logs juetzlify-backend        # View logs from all instances
pm2 monit                          # Monitor CPU/memory usage
```

**Important**: Cluster mode requires **stateless workers**. All shared state (play statistics, track cache) uses:
- **File-based storage** with atomic writes (see below)
- **Proper-lockfile** for write synchronization between workers

### Atomic File Writing

Critical data files use **atomic writes** to prevent corruption in cluster mode:

**Implementation** (`playStatisticsService.js`):
```javascript
async function atomicWriteStatistics(statistics) {
  const lock = await lockfile.lock(STATISTICS_LOCK, {
    retries: { retries: 5, minTimeout: 100 }
  });

  try {
    // Write to temporary file first
    await fs.writeFile(STATISTICS_TMP, JSON.stringify(statistics, null, 2));

    // Atomic rename (overwrites target atomically)
    await fs.rename(STATISTICS_TMP, STATISTICS_FILE);
  } finally {
    await lock();
  }
}
```

**Why Atomic Writes**:
- **Race condition prevention**: Multiple workers writing simultaneously
- **Data integrity**: No partial writes or corruption
- **Crash safety**: Temp file discarded if process dies mid-write
- **Lockfile coordination**: Ensures only one worker writes at a time

**Files with Atomic Writes**:
- `backend/data/play-statistics.json` - Play count and history
- `backend/data/track-visibility.json` - Track visibility settings
- `backend/data/settings.json` - Application settings

**Pattern**: Always write to `.tmp` file, then atomic `rename()` to final destination.

## Offline PWA Functionality

Jützlify is a **full Progressive Web App** with complete offline support.

### Service Worker Architecture

**Three-Tier Caching** (`audio-cache-sw.js`):

1. **APP_SHELL_CACHE** (`juetzlify-app-shell-v2`)
   - HTML, CSS, JavaScript, static assets
   - Pre-cached during Service Worker install
   - Cache-first strategy (instant load)

2. **API_CACHE** (`juetzlify-api-v2`)
   - API responses (`/api/tracks`, `/api/album-art`)
   - Network-first with cache fallback
   - Fresh data when online, stale data when offline

3. **AUDIO_CACHE** (`juetzlify-audio-v2`)
   - Audio streams (`/api/stream/:trackId`)
   - Special handling with pinning for downloads
   - LRU eviction for unpinned tracks

**Caching Strategies**:
```javascript
// Cache-First (static assets)
if (cached) return cached;
const response = await fetch(request);
cache.put(request, response.clone());
return response;

// Network-First (API, HTML)
try {
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
} catch {
  return await cache.match(request); // Offline fallback
}
```

### Download System

Users can **explicitly download tracks** for offline playback (separate from auto-cache).

**Architecture**:
1. **IndexedDB** (`juetzlify-downloads`) - Download metadata
   - Stores: trackId, filename, title, artist, downloadedAt, size
   - Persists across cache clears
   - Tracks which files are "pinned" downloads

2. **Service Worker Cache** - Actual audio files
   - Downloads marked with `sw-pinned: true` header
   - Pinned files **never deleted** by LRU cleanup
   - Unpinned (auto-cache) files subject to platform limits

3. **localStorage** - Offline play queue
   - Key: `juetzlify-offline-plays`
   - Stores plays with original timestamps
   - Auto-syncs when back online

**Platform-Specific Limits**:
- iOS Safari: 10 tracks (~67 MB)
- Android Chrome: 30 tracks (~200 MB)
- Desktop: 50 tracks (~334 MB)

**Download Flow**:
```
User clicks download
  ↓
Check limit via IndexedDB count
  ↓
Send DOWNLOAD_TRACK message to SW
  ↓
SW fetches with progress tracking via MessageChannel
  ↓
Save to cache with sw-pinned: true header
  ↓
Save metadata to IndexedDB
  ↓
Update UI: progress → checkmark
```

**Components**:
- `DownloadButton.jsx` - Download UI with progress indicator
- `DownloadLimitModal.jsx` - Swiss German limit error
- `OfflineIndicator.jsx` - Yellow banner when offline
- `hooks/useDownloads.js` - Download state management
- `hooks/useOnlineStatus.js` - Online/offline detection
- `services/downloadService.js` - IndexedDB operations
- `services/offlinePlayService.js` - Offline play queue

### Offline Play Tracking

Plays recorded offline sync automatically when reconnected:

**Offline Flow**:
1. Track plays 15+ seconds while offline
2. Play queued in localStorage with original timestamp
3. When online, `syncOfflinePlays()` called automatically
4. Backend receives plays with preserved timestamps
5. Statistics reflect original play time (not sync time)

**Backend Support**:
- `/api/tracks/:trackId/play` accepts optional `timestamp` parameter
- `recordPlay()` uses provided timestamp instead of `new Date()`
- Preserves accurate play history for wrapped/statistics

**Code** (`useAudioPlayer.js`):
```javascript
const playData = {
  trackId, filename, title, artist, album, visibility,
  timestamp: new Date().toISOString(),
  date: new Date().toISOString().split('T')[0]
};

if (isOnline) {
  await fetch(`/api/tracks/${trackId}/play`, {
    method: 'POST',
    body: JSON.stringify({ visibility, timestamp })
  });
} else {
  queueOfflinePlay(playData); // Save to localStorage
}
```

### PWA Installation

**Manifest** (`manifest.json`):
- Install to home screen on iOS/Android/Desktop
- Standalone display mode (no browser UI)
- App shortcuts to Public and Private pages
- Theme color: #2ECC71 (Jützlify green)

**Installation Triggers**:
- Desktop Chrome: Install icon in address bar
- iOS Safari: Share → "Add to Home Screen"
- Android Chrome: "Add to Home Screen" banner

**Update Strategy**:
- Service Worker checks for updates hourly
- Users can force update via DevTools
- Increment `CACHE_VERSION` to invalidate old caches

### Offline User Experience

**When Online**:
- Full app functionality
- Downloads save to cache
- Plays record immediately

**When Offline**:
- Yellow banner: "Offline-Modus - Nur abäladeni Liäder verfügbar"
- App loads from cache (HTML/CSS/JS)
- Only downloaded tracks playable
- Plays queue locally, sync when online
- Download button disabled

**Key Files**:
```
frontend/
├── public/
│   ├── audio-cache-sw.js       # Service Worker (PWA logic)
│   └── manifest.json            # PWA manifest
├── src/
│   ├── components/
│   │   ├── OfflineIndicator.jsx
│   │   ├── DownloadButton.jsx
│   │   └── DownloadLimitModal.jsx
│   ├── hooks/
│   │   ├── useOnlineStatus.js
│   │   └── useDownloads.js
│   ├── services/
│   │   ├── downloadService.js
│   │   └── offlinePlayService.js
│   └── contexts/
│       └── DownloadsContext.jsx
```

**Debugging**:
- DevTools > Application > Service Workers (check activation)
- DevTools > Application > Cache Storage (inspect caches)
- DevTools > Application > IndexedDB (view downloads)
- DevTools > Application > Local Storage (offline play queue)
- Console logs prefixed with `[Jützlify SW]`

See `OFFLINE_PWA.md` for complete PWA documentation and testing procedures.
