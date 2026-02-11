# ── BikiniBottom Live Demo ────────────────────────────────────────────────────
# Multi-stage build: dashboard (static) + sandbox server (Node)

# Stage 1: Install dependencies + build dashboard
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy everything needed for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY tools/sandbox/package.json tools/sandbox/tsconfig.json tools/sandbox/

RUN pnpm install --frozen-lockfile

# Copy sandbox source
COPY tools/sandbox/src/ ./tools/sandbox/src/
COPY tools/sandbox/ORG.md ./tools/sandbox/
COPY tools/sandbox/org/ ./tools/sandbox/org/
# scenarios are inside src/

# Build dashboard
ENV VITE_SANDBOX_MODE=true
RUN pnpm nx run dashboard:build --configuration=production

# Stage 2: Production runtime
FROM node:22-slim AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace root
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules

# Copy sandbox
COPY --from=build /app/tools/sandbox ./tools/sandbox

# Copy libs (needed for imports)
COPY --from=build /app/libs ./libs

# Copy built dashboard
COPY --from=build /app/dist/apps/dashboard ./dashboard-dist

ENV NODE_ENV=production
ENV SANDBOX_PORT=3333
ENV SERVE_DASHBOARD=1
ENV SANDBOX_READONLY=1

EXPOSE 3333

CMD ["node", "--import", "tsx", "tools/sandbox/src/index.ts"]
