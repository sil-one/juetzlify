# Build & Deploy Checklist

## Build (on Mac)

```bash
# 1. Build for Linux AMD64
docker build --platform linux/amd64 -f docker/Dockerfile -t juetzli-fm .

# 2. Verify platform
docker inspect juetzli-fm --format '{{.Os}}/{{.Architecture}}'
# Should show: linux/amd64

# 3. Export image
docker save juetzli-fm | gzip > juetzli-fm.tar.gz
```

## Deploy (on Server)

```bash
# 1. Transfer files to server
scp juetzli-fm.tar.gz user@server:~/
scp docker/docker-compose.server.yml user@server:~/docker-compose.yml
scp docker/Caddyfile user@server:~/

# 2. SSH into server
ssh user@server

# 3. Load image
gunzip -c juetzli-fm.tar.gz | docker load

# 4. Create directories (first time only)
mkdir -p tracks/public tracks/private cache

# 5. Start/restart
docker-compose down
docker-compose up -d

# 6. Check logs
docker-compose logs -f
```

## Update Existing Deployment

```bash
# On Mac
docker build --platform linux/amd64 -f docker/Dockerfile -t juetzli-fm .
docker save juetzli-fm | gzip > juetzli-fm.tar.gz
scp juetzli-fm.tar.gz user@server:~/

# On Server
gunzip -c juetzli-fm.tar.gz | docker load
docker-compose down
docker-compose up -d
```

## Upload Tracks

```bash
scp *.mp3 user@server:~/tracks/public/
# or for private tracks:
scp *.mp3 user@server:~/tracks/private/
```
