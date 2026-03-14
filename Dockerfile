# ── OpenSpawn Platform ────────────────────────────────────────────────────────
# Builds: dashboard, team dashboard, website, sandbox server

# Stage 1: Build all apps
FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json .npmrc ./
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
RUN pnpm nx build shared-types
RUN pnpm nx run dashboard:build --configuration=production
RUN VITE_BASE_PATH="/" pnpm nx run team:build --configuration=production
RUN pnpm nx run website:build

# Create standalone sandbox package with resolved workspace deps
RUN pnpm --filter @openspawn/sandbox deploy /app/sandbox-deploy --prod

# Stage 2: Minimal runtime
FROM node:24-alpine AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy deployed sandbox (includes resolved node_modules with shared-types)
COPY --from=build /app/sandbox-deploy ./
# Overwrite TS-only shared-types with compiled JS from build
COPY --from=build /app/dist/libs/shared-types ./node_modules/@openspawn/shared-types

# Copy built apps
COPY --from=build /app/dist/apps/dashboard ./dashboard-dist
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
