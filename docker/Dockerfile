# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci --workspace=frontend
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Stage 2: Setup backend
FROM node:20-alpine AS backend-builder

WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --workspace=backend --omit=dev
COPY backend/ ./backend/

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directories for tracks and cache
RUN mkdir -p /app/backend/tracks/public \
             /app/backend/tracks/private \
             /app/backend/cache/album-art

WORKDIR /app/backend

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "src/server.js"]
