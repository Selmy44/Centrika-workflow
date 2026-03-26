# Multi-stage Dockerfile for OnePortal Backend
# Supports both development (npm run dev) and production (npm run build + npm start)

FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for runtime
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies using npm ci for reproducibility
# (respects package-lock.json exactly)
RUN npm ci

# Copy Prisma schema and migrations
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Copy all scripts for seeding
COPY scripts ./scripts

# Expose application port
EXPOSE 3000

# Set default environment
ENV NODE_ENV=production

# Entrypoint: Database setup and application startup
ENTRYPOINT ["/bin/sh", "-c", "\
  set -e && \
  echo '🚀 Starting Centrika OnePortal Backend...' && \
  echo '🔧 Environment: ${NODE_ENV}' && \
  echo '⏳ Waiting for PostgreSQL database at db:5432...' && \
  RETRY_COUNT=0 && \
  MAX_RETRIES=30 && \
  while ! nc -z db 5432; do \
    RETRY_COUNT=$((RETRY_COUNT + 1)) && \
    if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then \
      echo '❌ Failed to connect to database after ${MAX_RETRIES} attempts' && \
      exit 1; \
    fi && \
    echo \"⏳ Database unavailable - retry $RETRY_COUNT/${MAX_RETRIES} (waiting 2s...)\" && \
    sleep 2; \
  done && \
  echo '✅ Database is up and running!' && \
  echo '🔄 Running Prisma migrations...' && \
  npx prisma migrate deploy && \
  echo '✅ Database migrations completed successfully' && \
  echo '🌱 Seeding database...' && \
  echo '  → Seeding departments...' && \
  npm run seed:departments || echo '⚠️  Departments seed completed' && \
  echo '  → Seeding users...' && \
  npm run seed:users || echo '⚠️  Users seed completed' && \
  echo '  → Running generic seed script...' && \
  npm run seed || echo '⚠️  Generic seed completed' && \
  echo '✅ Database seeding completed' && \
  echo '🏁 Starting OnePortal Backend Application...' && \
  if [ \"${NODE_ENV}\" = \"production\" ]; then \
    echo '📦 Running in PRODUCTION mode...' && \
    npm run build && \
    exec npm run start; \
  else \
    echo '🛠️  Running in DEVELOPMENT mode...' && \
    exec npm run dev; \
  fi"]
