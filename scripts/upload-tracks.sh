#!/bin/bash

# Configuration
VPS_USER="${VPS_USER:-your-user}"
VPS_IP="${VPS_IP:-your-vps-ip}"
VPS_PATH="${VPS_PATH:-/opt/juetzlify/tracks}"

usage() {
  echo "Upload MP3 tracks to Jützlify on VPS"
  echo ""
  echo "Usage: $0 [public|private] <path-to-mp3-files>"
  echo ""
  echo "Examples:"
  echo "  $0 public ./my-music/*.mp3"
  echo "  $0 private ~/Music/album/*.mp3"
  echo ""
  echo "Environment variables:"
  echo "  VPS_USER  - SSH username (default: your-user)"
  echo "  VPS_IP    - VPS IP address (default: your-vps-ip)"
  echo "  VPS_PATH  - Path on VPS (default: /opt/juetzlify/tracks)"
  echo ""
  echo "Example with custom settings:"
  echo "  VPS_USER=admin VPS_IP=192.168.1.100 $0 public *.mp3"
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

TYPE=$1
shift
FILES=$@

if [ "$TYPE" != "public" ] && [ "$TYPE" != "private" ]; then
  echo "❌ Error: Type must be 'public' or 'private'"
  usage
fi

echo "🎵 Uploading files to $TYPE library..."
echo "Target: $VPS_USER@$VPS_IP:$VPS_PATH/$TYPE/"
echo ""

# Upload files
scp $FILES $VPS_USER@$VPS_IP:$VPS_PATH/$TYPE/

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Files uploaded successfully!"
  echo ""
  echo "Restarting container to refresh metadata..."
  ssh $VPS_USER@$VPS_IP "docker restart juetzlify"

  if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Done! New tracks will be available in ~30 seconds."
  else
    echo ""
    echo "⚠️  Upload succeeded, but couldn't restart container."
    echo "You may need to manually run: docker restart juetzlify"
  fi
else
  echo ""
  echo "❌ Upload failed!"
  exit 1
fi
