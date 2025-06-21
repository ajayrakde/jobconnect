# --- Stage 1: Install deps and build everything ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install root (backend) deps
COPY package*.json ./
RUN npm install

# Copy all files including frontend
COPY . .

# Install frontend deps and build frontend
WORKDIR /app/client
RUN npm install && npm run build

# Go back to root to build backend
WORKDIR /app
RUN npm run build

# --- Stage 2: Runtime container ---
FROM node:18-alpine AS runner

WORKDIR /app

# Copy the entire built app
COPY --from=builder /app .

ENV NODE_ENV=production
# Render provides a PORT environment variable (usually 10000).
# EXPOSE is not required for most platforms, so omit it to avoid confusion.

CMD ["node", "dist/index.js"]
