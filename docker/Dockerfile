# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/ ./

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Copy backend with node_modules
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directories for tracks, cache, data, and logs
RUN mkdir -p /app/backend/tracks/all \
             /app/backend/cache/album-art \
             /app/backend/data \
             /app/backend/logs

WORKDIR /app/backend

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node_modules/.bin/pm2-runtime", "start", "ecosystem.config.cjs"]
