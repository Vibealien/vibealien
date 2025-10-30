# Multi-stage Dockerfile for User Service

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY services/user-service/package.json ./services/user-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/user-service/node_modules ./services/user-service/node_modules

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/user-service ./services/user-service

# Build shared packages
WORKDIR /app/shared/types
RUN pnpm build

WORKDIR /app/shared/utils
RUN pnpm build

# Generate Prisma Client
WORKDIR /app/services/user-service
RUN npx prisma generate

# Build user service
RUN pnpm build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 userservice

# Copy necessary files
COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/package.json ./
COPY --from=builder /app/services/user-service/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/user-service/node_modules ./node_modules

# Set user
USER userservice

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8002/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]
