# Jützli FM

A mobile-first music streaming web application with a sleek, minimal design.

## Features

- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Audio Player**: Full-featured player with album art, track info, and playback controls
- **Two-Tier Library**: Public tracks accessible to everyone, private tracks password-protected
- **Album Art Extraction**: Automatically extracts and caches album art from MP3 ID3 tags
- **Streaming**: Efficient MP3 streaming with byte-range support for seeking
- **Docker Deployment**: Single container deployment for easy hosting

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: Node.js + Express
- **Libraries**: music-metadata (ID3 tags), sharp (image processing)
- **Deployment**: Docker container with volume-mounted MP3 files

## Project Structure

```
juetzli-fm/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # React hooks
│   │   └── utils/      # Utilities
│   └── public/         # Static assets (logo)
│
├── backend/            # Node.js backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── config/     # Configuration
│   ├── tracks/         # MP3 files (volume-mounted)
│   │   ├── public/     # Public tracks
│   │   └── private/    # Private tracks
│   └── cache/          # Cached album art
│
├── docker/             # Docker configuration
├── scripts/            # Utility scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker (for deployment)
- Your logo image (SVG format recommended, or PNG with transparency, 220:280 aspect ratio)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd juetzli-fm
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (root, frontend, backend)
   npm run install:all
   ```

3. **Add your logo**
   - Place your logo as `frontend/public/logo.svg` (recommended) or `logo.png`
   - SVG format is recommended for best quality at all sizes
   - If using PNG, ensure it has transparency (220:280 aspect ratio)
   - Delete the placeholder file

4. **Set password for private library**
   ```bash
   # Generate password hash
   echo -n "your-password" | shasum -a 256
   ```
   - Copy the hash
   - Edit `frontend/src/hooks/useAuth.js`
   - Replace `YOUR_PASSWORD_HASH_HERE` with your hash

### Local Development

1. **Start backend** (in one terminal):
   ```bash
   npm run dev:backend
   ```

2. **Start frontend** (in another terminal):
   ```bash
   npm run dev:frontend
   ```

3. **Add sample MP3 files**
   ```bash
   # Add to public library
   cp ~/Music/sample.mp3 backend/tracks/public/

   # Add to private library
   cp ~/Music/sample2.mp3 backend/tracks/private/
   ```

4. **Open in browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/health

## Building for Production

```bash
# Build frontend
./scripts/build.sh

# Or manually:
cd frontend && npm run build && cd ..
```

## Docker Deployment

### Local Testing with Docker Compose

```bash
# Create local track directories
mkdir -p docker/tracks/public docker/tracks/private docker/cache

# Add some MP3 files
cp ~/Music/*.mp3 docker/tracks/public/

# Build and run
cd docker
docker-compose up --build
```

### Production Deployment to VPS

1. **Prepare VPS**
   ```bash
   # SSH into your VPS
   ssh user@your-vps-ip

   # Create directories
   sudo mkdir -p /opt/juetzli-fm/tracks/public
   sudo mkdir -p /opt/juetzli-fm/tracks/private
   sudo mkdir -p /opt/juetzli-fm/cache

   # Install Docker if needed
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Build and deploy** (on your local machine):
   ```bash
   # Build Docker image
   docker build -f docker/Dockerfile -t juetzli-fm .

   # Save and transfer
   docker save juetzli-fm | gzip > juetzli-fm.tar.gz
   scp juetzli-fm.tar.gz user@your-vps-ip:/tmp/

   # On VPS: Load and run
   ssh user@your-vps-ip
   docker load < /tmp/juetzli-fm.tar.gz
   docker run -d \
     -p 80:3000 \
     -v /opt/juetzli-fm/tracks:/app/backend/tracks \
     -v /opt/juetzli-fm/cache:/app/backend/cache \
     --name juetzli-fm \
     --restart unless-stopped \
     juetzli-fm
   ```

3. **Verify deployment**
   ```bash
   # Check logs
   docker logs juetzli-fm

   # Check status
   docker ps
   ```

## Managing Tracks

### Upload Tracks to VPS

Use the provided script:

```bash
# Set environment variables (first time)
export VPS_USER=your-user
export VPS_IP=your-vps-ip

# Upload public tracks
./scripts/upload-tracks.sh public ~/Music/album1/*.mp3

# Upload private tracks
./scripts/upload-tracks.sh private ~/Music/album2/*.mp3
```

Or manually with SCP:

```bash
# Upload files
scp song.mp3 user@vps-ip:/opt/juetzli-fm/tracks/public/

# Restart container to refresh metadata
ssh user@vps-ip "docker restart juetzli-fm"
```

### Move Track Between Libraries

```bash
# SSH into VPS
ssh user@vps-ip

# Move from public to private
mv /opt/juetzli-fm/tracks/public/song.mp3 /opt/juetzli-fm/tracks/private/

# Restart to refresh
docker restart juetzli-fm
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/tracks?type=public|private` - Get track list
- `GET /api/stream/:trackId` - Stream MP3 file
- `GET /api/album-art/:trackId.jpg` - Get cached album art
- `POST /api/tracks/refresh` - Refresh tracks cache

## Configuration

### Environment Variables

Backend configuration (`.env`):

```env
NODE_ENV=production
PORT=3000
TRACKS_PATH=/app/backend/tracks
CACHE_PATH=/app/backend/cache/album-art
```

### Frontend Constants

Edit `frontend/src/utils/constants.js`:

```javascript
export const COLORS = {
  primary: '#F50000',  // Jützli red
  black: '#000000',
  white: '#FFFFFF',
};
```

## Color Scheme

- **Primary**: #F50000 (Jützli Red)
- **Background**: #000000 (Black)
- **Text**: #FFFFFF (White)
- **Accents**: Gray shades

## Security Considerations

- **Password Protection**: Client-side SHA-256 hash comparison
  - Hash is visible in JS bundle
  - Suitable for casual privacy, not sensitive data
  - Future: Add backend JWT authentication for better security

- **MP3 Streaming**: No authentication on stream endpoints
  - Anyone with track ID can stream
  - Future: Add token-based URLs that expire

## Troubleshooting

### Tracks not loading

```bash
# Check backend logs
docker logs juetzli-fm

# Verify MP3 files exist
docker exec juetzli-fm ls -la /app/backend/tracks/public

# Refresh cache
curl -X POST http://your-vps-ip/api/tracks/refresh
```

### Album art not displaying

- Ensure MP3 files have embedded album art in ID3 tags
- Check cache directory permissions
- Check backend logs for image processing errors

### Container won't start

```bash
# Check logs
docker logs juetzli-fm

# Verify volumes exist
ls -la /opt/juetzli-fm/

# Test build locally
docker build -f docker/Dockerfile -t juetzli-fm-test .
docker run --rm -p 3000:3000 juetzli-fm-test
```

## Development

### Adding New Features

1. Frontend components: `frontend/src/components/`
2. Backend routes: `backend/src/routes/`
3. Services: `backend/src/services/`

### Running Tests

```bash
# Frontend tests (when added)
cd frontend && npm test

# Backend tests (when added)
cd backend && npm test
```

## License

MIT

## Credits

Built with Claude Code by Anthropic.
