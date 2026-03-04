# ── OpenSpawn Platform ────────────────────────────────────────────────────────
# Builds: demo dashboard, team dashboard, website, sandbox server

# Stage 1: Build all apps
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY tools/sandbox/package.json tools/sandbox/tsconfig.json tools/sandbox/

RUN pnpm install --frozen-lockfile

COPY tools/sandbox/src/ ./tools/sandbox/src/
COPY tools/sandbox/ORG.md ./tools/sandbox/
COPY tools/sandbox/org/ ./tools/sandbox/org/
COPY scripts/ ./scripts/

ARG VITE_DASHBOARD_THEME=openspawn
ENV VITE_SANDBOX_MODE=true
ENV VITE_DASHBOARD_THEME=${VITE_DASHBOARD_THEME}
RUN pnpm nx run demo:build --configuration=production
RUN pnpm nx run team:build --configuration=production
RUN pnpm nx run website:build

# Stage 2: Minimal runtime
FROM node:24-alpine AS runtime
WORKDIR /app

# Install only what the sandbox needs (no monorepo overhead)
COPY tools/sandbox/package.json ./package.json
COPY tools/sandbox/tsconfig.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --prod --no-frozen-lockfile \
    && pnpm add tsx unified remark-parse remark-frontmatter

# Copy sandbox source
COPY tools/sandbox/src/ ./src/
COPY tools/sandbox/ORG.md ./
COPY tools/sandbox/org/ ./org/

# Copy built apps
COPY --from=build /app/dist/apps/demo ./dashboard-dist
COPY --from=build /app/dist/apps/team ./team-dist
COPY --from=build /app/dist/apps/website ./website-dist

ENV WEBSITE_DIR=/app/website-dist
ENV TEAM_DIR=/app/team-dist
ENV NODE_ENV=production
ENV SANDBOX_PORT=3333
ENV SERVE_DASHBOARD=1
ENV SANDBOX_READONLY=1

EXPOSE 3333

CMD ["node", "--import", "tsx", "src/index.ts"]
