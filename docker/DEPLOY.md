# Jützlify Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Build & Deploy](#build--deploy)
- [Track Management](#track-management)
- [Updating](#updating)

## Prerequisites

- Docker and Docker Compose installed on your server
- A domain name (optional, for HTTPS via Caddy)
- SSH access to your server

## Configuration

### 1. Environment Variables

The `.env` file contains sensitive configuration and **must be placed in the `backend/` directory** on your server.

**Location on server**: `~/backend/.env` (relative to your docker-compose.yml location)

#### Generate Password Hashes

Before creating the .env file, generate secure password hashes:

```bash
# On Mac/Linux - Generate private library password hash
echo -n "your-private-password" | shasum -a 256

# Generate admin password hash
echo -n "your-admin-password" | shasum -a 256
```

**Important**: Use `echo -n` (without newline) to ensure correct hash generation.

#### Create .env File

Copy the example file and fill in your password hashes:

```bash
# On your server
mkdir -p backend
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=3000
TRACKS_PATH=/app/backend/tracks
CACHE_PATH=/app/backend/cache/album-art
DATA_PATH=/app/backend/data

# Authentication - Replace with your generated hashes
PRIVATE_PASSWORD_HASH=paste-your-private-hash-here
ADMIN_PASSWORD_HASH=paste-your-admin-hash-here
EOF
```

**Example with real hashes** (for development only - change these in production!):
```env
PRIVATE_PASSWORD_HASH=04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb
ADMIN_PASSWORD_HASH=8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
```

### 2. Domain Configuration (Optional)

Edit the `Caddyfile` to use your domain:

```bash
# Replace 'localhost' with your domain
nano Caddyfile
```

Example Caddyfile:
```
music.yourdomain.com {
    reverse_proxy juetzlify:3000
}
```

For development/testing without a domain, use:
```
:80 {
    reverse_proxy juetzlify:3000
}
```

## Build & Deploy

### Initial Deployment

#### On Mac (Build)

```bash
# 1. Build for Linux AMD64
docker build --platform linux/amd64 -f docker/Dockerfile -t juetzlify .

# 2. Verify platform
docker inspect juetzlify --format '{{.Os}}/{{.Architecture}}'
# Should show: linux/amd64

# 3. Export image
docker save juetzlify | gzip > juetzlify.tar.gz
```

#### On Server (Deploy)

```bash
# 1. Transfer files to server
scp juetzlify.tar.gz user@server:~/juetzlify/
scp docker/docker-compose.server.yml user@server:~/juetzlify/docker-compose.yml
scp docker/Caddyfile user@server:~/juetzlify/
scp backend/.env.example user@server:~/juetzlify/backend/.env.example

# 2. SSH into server
ssh user@server
cd juetzlify

# 3. Configure environment (IMPORTANT - do this before starting!)
mkdir -p backend
nano backend/.env
# Paste your configuration with password hashes (see Configuration section above)

# 4. Load Docker image
gunzip -c juetzlify.tar.gz | docker load

# 5. Create required directories (first time only)
mkdir -p tracks/all cache data

# 6. Start services
docker-compose up -d

# 7. Check logs to verify successful startup
docker-compose logs -f juetzlify
```

**Directory Structure on Server:**
```
~/juetzlify/
├── docker-compose.yml
├── Caddyfile
├── backend/
│   └── .env              # Your configuration (REQUIRED)
├── tracks/
│   └── all/              # Put all MP3 files here
├── cache/                # Auto-generated album art cache
└── data/                 # Track visibility metadata
```

## Track Management

### Adding New Tracks

**New folder structure** (as of latest version):
- All tracks go in `tracks/all/` folder
- Use admin panel to set visibility (public/private/disabled)

```bash
# Upload MP3 files to server
scp *.mp3 user@server:~/juetzlify/tracks/all/

# Or upload an entire folder
scp -r /path/to/album/*.mp3 user@server:~/juetzlify/tracks/all/
```

### Setting Track Visibility

1. Access admin panel: `http://your-domain/admin`
2. Login with your admin password
3. Set each track to:
   - **Public**: Available to everyone
   - **Private**: Password-protected (requires private library password)
   - **Disabled**: Hidden from both public and private pages

**Note**: New tracks default to **disabled** visibility for security.

### Legacy Migration

If you have an old deployment with `tracks/public/` and `tracks/private/` folders:

1. Access the admin panel
2. Click "Migrate from old structure" button
3. All tracks will be moved to `tracks/all/` and visibility will be preserved

## Updating

### Update to New Version

```bash
# On Mac - Build new version
docker build --platform linux/amd64 -f docker/Dockerfile -t juetzlify .
docker save juetzlify | gzip > juetzlify.tar.gz
scp juetzlify.tar.gz user@server:~/juetzlify/

# On Server - Deploy update
cd juetzlify
gunzip -c juetzlify.tar.gz | docker load
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f juetzlify
```

**Important**: Your `.env` file, tracks, cache, and data persist between updates.

### Refresh Metadata Cache

If you've updated MP3 file metadata (album art, tags, etc.):

```bash
# Via API (requires authentication if protected)
curl -X POST http://localhost:3000/api/tracks/refresh

# Or restart the container
docker-compose restart juetzlify
```

## Troubleshooting

### Check if .env is loaded

```bash
# View container environment variables
docker exec juetzlify env | grep PASSWORD

# You should see PRIVATE_PASSWORD_HASH and ADMIN_PASSWORD_HASH
```

### Permission Issues

```bash
# Fix permissions for tracks and cache directories
sudo chown -R $USER:$USER tracks cache data
chmod -R 755 tracks cache data
```

### View Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View only juetzlify service logs
docker-compose logs -f juetzlify
```

### Clear Album Art Cache

```bash
# Delete cache and restart
rm -rf cache/*
docker-compose restart juetzlify
```

## Security Notes

- **Never commit** your `.env` file to version control
- Use **strong, unique passwords** for both private and admin access
- Keep your `.env.example` file updated with variable names (but not real values)
- Consider using a firewall to restrict access to port 3000 (only Caddy should access it)
- Regularly update your Docker images for security patches
