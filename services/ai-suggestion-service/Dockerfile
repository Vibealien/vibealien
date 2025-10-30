FROM node:18-alpine AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/ai-suggestion-service/package.json ./services/ai-suggestion-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/ai-suggestion-service/node_modules ./services/ai-suggestion-service/node_modules
COPY --from=deps /app/shared ./shared
COPY shared/ ./shared/
COPY services/ai-suggestion-service/ ./services/ai-suggestion-service/
COPY tsconfig.json ./
RUN npm install -g pnpm@8.15.0
WORKDIR /app/services/ai-suggestion-service
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/ai-suggestion-service/dist ./dist
COPY --from=builder /app/services/ai-suggestion-service/package.json ./
COPY --from=deps /app/services/ai-suggestion-service/node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=8007
EXPOSE 8007
CMD ["node", "dist/server.js"]
