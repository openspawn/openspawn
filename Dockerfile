# ── BikiniBottom Live Demo ────────────────────────────────────────────────────
# Lean build: dashboard static files + sandbox server only

# Stage 1: Build dashboard
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

ENV VITE_SANDBOX_MODE=true
RUN pnpm nx run dashboard:build --configuration=production
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

# Copy built dashboard and website
COPY --from=build /app/dist/apps/dashboard ./dashboard-dist
COPY --from=build /app/dist/apps/website ./website-dist

ENV WEBSITE_DIR=/app/website-dist
ENV NODE_ENV=production
ENV SANDBOX_PORT=3333
ENV SERVE_DASHBOARD=1
ENV SANDBOX_READONLY=1

EXPOSE 3333

CMD ["node", "--import", "tsx", "src/index.ts"]
