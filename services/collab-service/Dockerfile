FROM node:18-alpine AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/collab-service/package.json ./services/collab-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/collab-service/node_modules ./services/collab-service/node_modules
COPY --from=deps /app/shared ./shared

# Copy source
COPY shared/ ./shared/
COPY services/collab-service/ ./services/collab-service/
COPY tsconfig.json ./

# Build
RUN npm install -g pnpm@8.15.0
WORKDIR /app/services/collab-service
RUN pnpm build

# Generate Prisma Client
RUN npx prisma generate

FROM node:18-alpine AS runner
WORKDIR /app

# Copy built files
COPY --from=builder /app/services/collab-service/dist ./dist
COPY --from=builder /app/services/collab-service/prisma ./prisma
COPY --from=builder /app/services/collab-service/package.json ./
COPY --from=deps /app/services/collab-service/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8005

EXPOSE 8005

CMD ["node", "dist/server.js"]
