FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY tools/ ./tools/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile
RUN npx tsc -b apps/api/tsconfig.app.json && pnpm nx build api --configuration=production

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist/apps/api ./

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --no-frozen-lockfile && pnpm add tslib @as-integrations/express5

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "main.js"]
