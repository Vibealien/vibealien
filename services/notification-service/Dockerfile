FROM node:18-alpine AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/notification-service/package.json ./services/notification-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/notification-service/node_modules ./services/notification-service/node_modules
COPY --from=deps /app/shared ./shared
COPY shared/ ./shared/
COPY services/notification-service/ ./services/notification-service/
COPY tsconfig.json ./
RUN npm install -g pnpm@8.15.0
WORKDIR /app/services/notification-service
RUN pnpm build
RUN npx prisma generate

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/notification-service/dist ./dist
COPY --from=builder /app/services/notification-service/prisma ./prisma
COPY --from=builder /app/services/notification-service/package.json ./
COPY --from=deps /app/services/notification-service/node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=8006
EXPOSE 8006
CMD ["node", "dist/server.js"]
