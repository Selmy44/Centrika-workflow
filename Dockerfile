# -----------------------------
# 1. Build stage
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy rest of the code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build


# -----------------------------
# 2. Production stage
# -----------------------------
FROM node:20-alpine

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy built app
COPY --from=builder /app/dist ./dist

# 🔥 FIX 1: Copy FULL node_modules (not only .prisma)
COPY --from=builder /app/node_modules ./node_modules

# 🔥 FIX 2: Copy prisma folder (migrations + schema)
COPY --from=builder /app/prisma ./prisma

# 🔥 FIX 3: Add environment variable (important for Docker)
ENV NODE_ENV=production

# 🔥 FIX 4: Ensure correct port
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]
