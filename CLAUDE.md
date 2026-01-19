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

## Commands

### Installation
```bash
npm run install:all  # Installs all dependencies (root, frontend, backend)
```

### Development
```bash
# Run in separate terminals
npm run dev:backend   # Backend on port 3000
npm run dev:frontend  # Frontend on port 5173 (proxies API to localhost:3000)
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
- **Components**: `components/` - AudioPlayer, TrackList, AlbumArt, Header, PasswordPrompt, PrivateButton
- **Pages**: `pages/` - PublicPage (`/`), PrivatePage (`/private`), AdminPage (`/admin`)
- **Hooks**: `hooks/` - `useAudioPlayer` (playback state/controls), `useAuth` (backend-validated auth for private and admin)
- **Constants**: `utils/constants.js` - colors, API base URL (auto-switches dev/prod)

### Backend (`backend/src/`)
- **Entry**: `server.js` - Express app with CORS, logging, static serving
- **Routes**:
  - `routes/auth.js` - Authentication endpoints for private and admin access
  - `routes/admin.js` - Admin endpoints for track visibility management and migration
  - `routes/tracks.js` - Track listing with visibility filtering, cache refresh
  - `routes/stream.js` - HTTP range-request streaming
- **Services**:
  - `services/trackService.js` - Track discovery/caching with visibility filtering
  - `services/visibilityService.js` - Track visibility metadata management and migration
  - `services/metadataService.js` - ID3 extraction via music-metadata
  - `services/albumArtService.js` - Sharp image caching
- **Config**: `config/config.js` - reads from .env (PORT, TRACKS_PATH, CACHE_PATH, DATA_PATH, password hashes)

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
| `/api/tracks?type=public\|private` | GET | Fetch tracks list (filtered by visibility) |
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
