# ── BikiniBottom Live Demo ────────────────────────────────────────────────────
# Multi-stage build: dashboard (static) + sandbox server (Node)

# Stage 1: Install dependencies
FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json apps/dashboard/
COPY libs/demo-data/package.json libs/demo-data/
COPY tools/sandbox/package.json tools/sandbox/
RUN pnpm install --frozen-lockfile

# Stage 2: Build dashboard
FROM deps AS dashboard-build
COPY . .
ENV VITE_SANDBOX_MODE=true
RUN pnpm nx run dashboard:build --configuration=production
# Output: apps/dashboard/dist/

# Stage 3: Production runtime
FROM node:22-slim AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy sandbox + deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/tools/sandbox/node_modules ./tools/sandbox/node_modules
COPY tools/sandbox/ ./tools/sandbox/

# Copy built dashboard
COPY --from=dashboard-build /app/dist/apps/dashboard ./dashboard-dist

# Copy workspace config (needed for module resolution)
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY libs/ ./libs/

ENV NODE_ENV=production
ENV SANDBOX_PORT=3333
ENV SERVE_DASHBOARD=1
ENV SANDBOX_READONLY=1

EXPOSE 3333

CMD ["node", "--import", "tsx", "tools/sandbox/src/index.ts"]
