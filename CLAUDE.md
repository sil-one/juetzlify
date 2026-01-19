# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jützlify is a mobile-first music streaming SPA with a two-tier track library (public and password-protected private tracks). Album art is extracted from MP3 ID3 tags.

**Stack**: React 19 + Vite frontend, Express + Node.js backend, Tailwind CSS styling

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
- **Pages**: `pages/` - PublicPage (`/`), PrivatePage (`/private`)
- **Hooks**: `hooks/` - `useAudioPlayer` (playback state/controls), `useAuth` (client-side SHA-256 auth)
- **Constants**: `utils/constants.js` - colors, API base URL (auto-switches dev/prod)

### Backend (`backend/src/`)
- **Entry**: `server.js` - Express app with CORS, logging, static serving
- **Routes**: `routes/tracks.js` (listing, cache refresh), `routes/stream.js` (HTTP range-request streaming)
- **Services**: `services/trackService.js` (discovery/caching), `services/metadataService.js` (ID3 extraction via music-metadata), `services/albumArtService.js` (Sharp image caching)
- **Config**: `config/config.js` - reads from .env (PORT, TRACKS_PATH, CACHE_PATH)

### Data Flow
1. Backend scans `backend/tracks/public/` and `backend/tracks/private/` for MP3s
2. Metadata extracted via music-metadata, album art cached via Sharp
3. Frontend fetches track list from `/api/tracks?type=public|private`
4. Audio streams via `/api/stream/:trackId` with HTTP range support

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tracks?type=public\|private` | GET | Fetch tracks list |
| `/api/stream/:trackId` | GET | Stream MP3 (supports Range header) |
| `/api/album-art/:trackId.jpg` | GET | Serve cached album art |
| `/api/tracks/refresh` | POST | Clear cache and reload metadata |

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

Private library uses client-side SHA-256 password hashing. The expected hash is stored in `frontend/src/hooks/useAuth.js`. Generate hash with:
```bash
echo -n "your-password" | shasum -a 256
```
