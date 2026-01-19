#!/bin/bash
set -e

echo "🎵 Building Jützlify..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing root dependencies..."
  npm install
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "✓ Build complete!"
echo ""
echo "Frontend build output: frontend/dist/"
echo ""
echo "Next steps:"
echo "  - For Docker deployment: docker build -f docker/Dockerfile -t juetzlify ."
echo "  - For local testing: npm run dev:backend (in one terminal) and npm run dev:frontend (in another)"
