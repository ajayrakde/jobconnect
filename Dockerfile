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

# Copy built backend + deps
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# ✅ Copy frontend build output
COPY --from=builder /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/index.js"]
