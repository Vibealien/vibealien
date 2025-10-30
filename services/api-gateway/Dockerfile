FROM node:18-alpine AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/api-gateway/package.json ./services/api-gateway/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/api-gateway/node_modules ./services/api-gateway/node_modules
COPY --from=deps /app/shared ./shared
COPY shared/ ./shared/
COPY services/api-gateway/ ./services/api-gateway/
COPY tsconfig.json ./
RUN npm install -g pnpm@8.15.0
WORKDIR /app/services/api-gateway
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json ./
COPY --from=deps /app/services/api-gateway/node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
CMD ["node", "dist/server.js"]
