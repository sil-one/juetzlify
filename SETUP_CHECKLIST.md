# Setup Checklist for Jützlify

Complete these steps before deploying:

## Required Setup Steps

### 1. Add Your Logo
- [X] Place your logo as `frontend/public/logo.svg` (SVG format recommended)
  - SVG is preferred for scalability and quality at all sizes
  - Or use `logo.png` if you prefer raster format
- [X] Ensure your logo has a transparent background
- [X] Aspect ratio should be approximately 220:280 (width:height)
- [X] Delete `frontend/public/logo.svg.placeholder`

### 2. Set Password for Private Library
- [ ] Generate password hash:
  ```bash
  echo -n "your-actual-password" | shasum -a 256
  ```
- [ ] Copy the generated hash
- [ ] Edit `frontend/src/hooks/useAuth.js`
- [ ] Replace `YOUR_PASSWORD_HASH_HERE` with your hash (line 5)

### 3. Configure VPS Details (for deployment)
- [ ] Note your VPS SSH username
- [ ] Note your VPS IP address
- [ ] Update `scripts/upload-tracks.sh` or use environment variables:
  ```bash
  export VPS_USER=your-username
  export VPS_IP=your-vps-ip
  ```

### 4. Test Locally (Optional but Recommended)

#### Install Dependencies
```bash
# From project root
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

#### Add Sample MP3 Files
```bash
# Create test files
cp ~/Music/sample.mp3 backend/tracks/public/
cp ~/Music/sample2.mp3 backend/tracks/private/
```

#### Run in Development Mode
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Open http://localhost:5173 in your browser
```

### 5. Build and Deploy

#### Option A: Local Build + Manual Deploy
```bash
# Build
./scripts/build.sh

# Build Docker image
docker build -f docker/Dockerfile -t juetzlify .

# Save and transfer to VPS
docker save juetzlify | gzip > juetzlify.tar.gz
scp juetzlify.tar.gz user@vps-ip:/tmp/

# On VPS: Setup directories
ssh user@vps-ip
sudo mkdir -p /opt/juetzlify/tracks/{public,private}
sudo mkdir -p /opt/juetzlify/cache

# Load and run container
docker load < /tmp/juetzlify.tar.gz
docker run -d \
  -p 80:3000 \
  -v /opt/juetzlify/tracks:/app/backend/tracks \
  -v /opt/juetzlify/cache:/app/backend/cache \
  --name juetzlify \
  --restart unless-stopped \
  juetzlify
```

#### Option B: Docker Compose (Local Testing)
```bash
cd docker
mkdir -p tracks/public tracks/private cache
cp ~/Music/*.mp3 tracks/public/
docker-compose up --build
```

### 6. Upload Your Music
```bash
# Using the upload script
./scripts/upload-tracks.sh public ~/Music/PublicAlbum/*.mp3
./scripts/upload-tracks.sh private ~/Music/PrivateAlbum/*.mp3

# Or manually
scp ~/Music/*.mp3 user@vps-ip:/opt/juetzlify/tracks/public/
ssh user@vps-ip "docker restart juetzlify"
```

### 7. Verify Deployment
- [ ] Access http://your-vps-ip in browser
- [ ] Check public page loads tracks
- [ ] Test audio playback
- [ ] Navigate to /private
- [ ] Enter password and verify private tracks load
- [ ] Test album art displays correctly
- [ ] Test on mobile device

## Post-Deployment

### Monitor Logs
```bash
# View logs
docker logs juetzlify -f

# Check running containers
docker ps
```

### Update Application
```bash
# Rebuild and redeploy
docker build -f docker/Dockerfile -t juetzlify .
docker save juetzlify | gzip > juetzlify.tar.gz
scp juetzlify.tar.gz user@vps-ip:/tmp/

# On VPS
ssh user@vps-ip
docker stop juetzlify
docker rm juetzlify
docker load < /tmp/juetzlify.tar.gz
docker run -d -p 80:3000 \
  -v /opt/juetzlify/tracks:/app/backend/tracks \
  -v /opt/juetzlify/cache:/app/backend/cache \
  --name juetzlify --restart unless-stopped juetzlify
```

### Add More Tracks
```bash
# Upload new tracks anytime
./scripts/upload-tracks.sh public ~/Music/new-album/*.mp3

# Tracks are automatically detected after container restart
```

## Common Issues

### Logo Not Showing
- Ensure `logo.svg` (or `logo.png`) exists in `frontend/public/`
- If using PNG instead of SVG, update `frontend/src/components/Header.jsx` to reference `/logo.png`
- Check file permissions
- Rebuild frontend: `cd frontend && npm run build`

### Password Not Working
- Verify hash in `frontend/src/hooks/useAuth.js`
- Hash must match exactly (use echo -n, not echo)
- Clear browser sessionStorage and try again

### Tracks Not Loading
- Check MP3 files exist in correct directory
- View logs: `docker logs juetzlify`
- Restart container: `docker restart juetzlify`
- Verify file permissions on VPS

### Album Art Not Showing
- Ensure MP3 files have embedded ID3 tags with album art
- Check cache directory exists and is writable
- View backend logs for image processing errors

## Support

For issues or questions, refer to README.md or check the backend logs.
