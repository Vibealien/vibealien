FROM node:18-alpine AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/compiler-service/package.json ./services/compiler-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/compiler-service/node_modules ./services/compiler-service/node_modules
COPY --from=deps /app/shared ./shared

# Copy source
COPY shared/ ./shared/
COPY services/compiler-service/ ./services/compiler-service/
COPY tsconfig.json ./

# Build
RUN npm install -g pnpm@8.15.0
WORKDIR /app/services/compiler-service
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

# Install Docker CLI for Docker-in-Docker
RUN apk add --no-cache docker-cli

# Copy built files
COPY --from=builder /app/services/compiler-service/dist ./dist
COPY --from=builder /app/services/compiler-service/package.json ./
COPY --from=deps /app/services/compiler-service/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8004

EXPOSE 8004

CMD ["node", "dist/server.js"]
